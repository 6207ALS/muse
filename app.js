const config = require("./lib/config");
const catchError = require("./lib/catch-error");
const express = require("express");
const flash = require("express-flash");
const morgan = require("morgan");
const session = require("express-session");
const store = require("connect-loki");
const { body, validationResult } = require("express-validator");
const PgPersistence = require("./lib/pg-persistence");

const PORT = config.PORT;
const HOST = config.HOST;
const app = express();
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(flash());
app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "muse-user-session-id",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}),
}));

// Create a new data store
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// Extract session information
app.use((req, res, next) => {
  res.locals.signedIn = req.session.signedIn;
  res.locals.username = req.session.username;
  res.locals.flash = req.session.flash;
  delete req.session.flash;

  next();
});

// Detect unauthorized access to routes
const requiresAuthentication = (req, res, next) => {
  if (!req.session.signedIn) {
    req.session.returnTo = req.originalUrl;
    req.flash("info", "Please sign in.");
    res.redirect("/signin");
  } else {
    next(); 
  }
};

// Detect if user is authorized to access URL
const isAuthorized = (user, authorizedUsers) => {
  return authorizedUsers.includes(user);
};

// Validate post information provided by user input
const validatePostInput = (input, min, max) => {
  return body(input)
    .trim()
    .isLength({ min })
    .withMessage(`Post ${input} is required. Minimum ${min} character(s).`)
    .isLength({ max })
    .withMessage(`Post ${input} is too long. Max ${max} characters`)
}

// Render "Page Not Found" page
const redirectNotFound = (req, res, next) => {
  req.flash("error", "Page not found.");
  res.redirect("/not-found");
}

// Validate comment information provided by user input
const validateCommentInput = input => {
  return body(input)
    .trim()
    .isLength({ min: 1 })
    .withMessage("Comment text is required. Minimum 1 character.")
    .isLength({ max: 200 })
    .withMessage("Comment is too long. Maximum 200 characters.");
}

// Redirect to start page
app.get("/", 
  requiresAuthentication,
  (req, res) => {
    res.redirect("/posts/1");
  }
);

app.get("/not-found", (req, res, next) => {
  res.render("not-found");
})

// Render the first page of all posts
app.get("/posts",
  requiresAuthentication,
  (req, res) => {
    res.redirect("/posts/1");
  }
);

// Render page to sign in
app.get("/signin", (req, res) => {
  res.render("signin");
});

// Render page to create a new post
app.get("/posts/create",
  requiresAuthentication,
  (req, res, next) => {
    res.render('create-post');
  }
);

// Render all posts for a given page number
app.get("/posts/:pageNumber", 
  requiresAuthentication,
  catchError(async (req, res, next) => {
    let pageNumber = +req.params.pageNumber;
    let postsQuery = res.locals.store.loadPosts(+pageNumber);
    let pageCountQuery = res.locals.store.postsPageCount();
    let resultsBoth = await Promise.all([postsQuery, pageCountQuery]);

    let posts = resultsBoth[0];
    let pageCount = +resultsBoth[1];

    if (posts === undefined || pageNumber > pageCount) {
      redirectNotFound(req, res, next);
    } else {
      res.render("posts", { posts, pageCount, pageNumber });
    }
  })
);

// Render individual post
app.get("/posts/post/:postId/comments/:commentsPage", 
  requiresAuthentication,
  catchError(async (req, res, next) => {
    let postId = +req.params.postId;
    let commentsPage = +req.params.commentsPage;

    let postQuery = res.locals.store.loadPost(postId);
    let commentsQuery = res.locals.store.loadComments(postId, commentsPage);
    let pageCountQuery = res.locals.store.commentsPageCount(postId);
    let resultsAll = await Promise.all([
      postQuery, commentsQuery, pageCountQuery
    ]);
    

    let [ post, comments, pageCount ] = resultsAll;

    if (!post || !comments || commentsPage > +pageCount) {
      redirectNotFound(req, res, next);
    } else {
      req.session.redirectPath = req.originalUrl;
      res.render("post", { post, comments, commentsPage, pageCount: +pageCount });
    }
  })
);

// Render user's posts
app.get("/:username/posts",
  requiresAuthentication,
  catchError(async (req, res, next) => {
    let user = req.params.username;
    let userExists = await res.locals.store.userExists(user);
    if (!userExists) {
      redirectNotFound(req, res, next);
    } else {
      let posts = await res.locals.store.loadUserPosts(user);
      res.render("user-posts", { posts, user });
    }
  })
);

// Render page to edit user's post
app.get("/:username/posts/:postId/comments/:commentsPage/edit",
  requiresAuthentication,
  catchError(async (req, res, next) => {
    let postId = +req.params.postId;
    let commentsPage = +req.params.commentsPage;

    let postUserQuery = res.locals.store.postUser(postId);
    let postQuery = res.locals.store.loadPost(postId);
    let commentsQuery = res.locals.store.loadComments(postId, commentsPage);
    let pageCountQuery = res.locals.store.commentsPageCount(postId);

    let resultsAll = await Promise.all([
      postUserQuery, postQuery, commentsQuery, pageCountQuery
    ]);

    let [ postUser, post, comments, pageCount ] = resultsAll;
    console.log([ req.session.username, postUser ]);

    if (!post || !comments || commentsPage > +pageCount) {
      redirectNotFound(req, res, next);
    } else if (!isAuthorized(req.session.username, [ postUser ])) {
      req.flash("error", `Unauthorized. Redirected to ${req.session.username}'s posts.`);
      res.redirect(`/${req.session.username}/posts`);
    } else {
      req.session.redirectPath = req.originalUrl;
      res.render("edit-post", { 
        post,
        comments,
        commentsPage,
        pageCount: +pageCount
      });
    }
  })
);

// Render page to edit a comment from a user's post
app.get("/:username/posts/:postId/comment/:commentId/edit",
  requiresAuthentication,
  catchError(async (req, res, next) => {
    let postId = +req.params.postId;
    let commentId = +req.params.commentId;
    let redirectPath = req.session.redirectPath;

    let commentQuery = res.locals.store.loadComment(commentId);
    let commentUserQuery = res.locals.store.commentUser(commentId);
    let postUserQuery = res.locals.store.postUser(postId);
    let resultsAll = await Promise.all([
      commentQuery, commentUserQuery, postUserQuery
    ]);

    let [ comment, commentUser, postUser ] = resultsAll;

    if (!comment) {
      redirectNotFound(req, res, next);
    } else if (!isAuthorized(req.session.username, [ commentUser, postUser ] )) {
      req.flash("error", `Unauthorized. Redirected to ${req.session.username}'s posts.`);
      res.redirect(`/${req.session.username}/posts`);
    } else {
      res.render("edit-comment", { comment, redirectPath });
    }
  })
);

// Create a new post
app.post("/posts/create",
  requiresAuthentication,
  [
    validatePostInput("title", 1, 100),
    validatePostInput("description", 1, 400),
    validatePostInput("song", 1, 80),
    validatePostInput("artist", 1, 80)
  ],
  catchError(async (req, res, next) => {
    let { title, description, song, artist } = req.body;
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      errors.array().forEach(err => req.flash("error", err.msg));

      res.render("create-post", {
        flash: req.flash(),
        post: { title, description, song, artist },
      });
    } else {
      let postInfo = [ title, description, song, artist ];
      let posted = await res.locals.store.createPost(...postInfo);
      if (!posted) {
        redirectNotFound(req, res, next);
      } else {
        req.flash("success", "Post created.")
        res.redirect("/posts/1");
      }
    }
  })
);

// Create a comment for individual post
app.post("/posts/post/:postId",
  requiresAuthentication,
  [ validateCommentInput("comment") ],
  catchError(async (req, res, next) => {
    let comment = req.body.comment;
    let postId = +req.params.postId;

    let postQuery = res.locals.store.loadPost(postId);
    let commentsQuery = res.locals.store.loadComments(postId, 1);
    let pageCountQuery = res.locals.store.commentsPageCount(postId);
    let resultsAll = await Promise.all([
      postQuery, commentsQuery, pageCountQuery
    ]);

    let [ post, comments, pageCount ] = resultsAll;
    let errors = validationResult(req);

    if (!post || !comments) {
      redirectNotFound(req, res, next);
    } else if (!errors.isEmpty()) {
      errors.array().forEach(err => req.flash("error", err.msg));

      res.render("post", { 
        flash: req.flash(),
        post, 
        comments,
        commentsPage: 1,
        pageCount
      });
    } else {
      let postedComment = await res.locals.store.postComment(postId, comment);
      if (!postedComment) redirectNotFound(req, res, next);
  
      req.flash("success", "Comment posted.");
      res.redirect(`/posts/post/${postId}/comments/1`);
    }
  })
);

// Edit user's post information
app.post("/:username/posts/:postId/edit",
  requiresAuthentication,
  [ 
    validatePostInput("title", 1, 100),
    validatePostInput("description", 1, 400),
    validatePostInput("song", 1, 80),
    validatePostInput("artist", 1, 80)
  ],
  catchError(async (req, res, next) => {
    let user = req.params.username;
    let postId = +req.params.postId;
    
    let { id, title, description, song, artist } = req.body;
    let postInfo = [ postId, title, description, song, artist ];

    let postUser = await res.locals.store.postUser(postId);
    let errors = validationResult(req);

    if (!isAuthorized(req.session.username, [ postUser ])) {
      req.flash("error", `Unauthorized. Redirected to ${req.session.username}'s posts.`);
      res.redirect(`/${req.session.username}/posts`);
    } else if (!errors.isEmpty()) {
      errors.array().forEach(err => req.flash("error", err.msg));
      let commentsQuery = res.locals.store.loadComments(postId, 1);
      let pageCountQuery = res.locals.store.commentsPageCount(postId);

      let resultsAll = await Promise.all([ commentsQuery, pageCountQuery])
      let [ comments, pageCount ] = resultsAll;

      res.render("edit-post", {
        flash: req.flash(),
        post: { id: +id, title, description, song, artist },
        comments,
        commentsPage: 1,
        pageCount,
      });
    } else {
      let editPost = await res.locals.store.updatePost(...postInfo);
      if (!editPost) {
        redirectNotFound(req, res, next);
      } else {
        req.flash("success", "Post edited.");
        res.redirect(`/${user}/posts`);
      }
    }
  })
);

// Delete user's post
app.post("/:username/posts/:postId/destroy",
  requiresAuthentication,
  catchError(async (req, res, next) => {
    let user = req.params.username;
    let postId = +req.params.postId;
    let postUser = await res.locals.store.postUser(postId);

    if (!isAuthorized(req.session.username, [ postUser ])) {
      req.flash("error", `Unauthorized. Redirected to ${req.session.username}'s posts.`);
      res.redirect(`/${req.session.username}/posts`);
    } else {
      let deleted = await res.locals.store.deletePost(+postId);
      if (!deleted) {
        redirectNotFound(req, res, next);
      } else {
        req.flash("success", "Post deleted.");
        res.redirect(`/${user}/posts`);
      }
    }
  })
);

// Edit a comment from user's post
app.post("/:username/posts/:postId/comment/:commentId/edit",
  requiresAuthentication,
  [ validateCommentInput("comment") ],
  catchError(async (req, res, next) => {
    let postId = +req.params.postId;
    let commentId = +req.params.commentId;
    let commentInfo = req.body.comment;

    let commentUserQuery = res.locals.store.commentUser(commentId);
    let postUserQuery = res.locals.store.postUser(postId);
    let resultsAll = await Promise.all([ commentUserQuery, postUserQuery ]);
    let [ commentUser, postUser ] = resultsAll;

    let redirectPath = req.session.redirectPath;
    let errors = validationResult(req);

    if (!isAuthorized(req.session.username, [ postUser, commentUser ])) {
      req.flash("error", `Unauthorized. Redirected to ${req.session.username}'s posts.`);
      res.redirect(`/${req.session.username}/posts`);
    } else if (!errors.isEmpty()) {
      errors.array().forEach(err => req.flash("error", err.msg));

      let comment = await res.locals.store.loadComment(+commentId);
      if (!comment) redirectNotFound(req, res, next);

      comment.comment = commentInfo;
      res.render("edit-comment", { flash: req.flash(), comment, redirectPath});
    } else {
      let editPost = await res.locals.store.updateComment(+commentId, commentInfo);
      if (!editPost) {
        redirectNotFound(req, res, next);
      } else {
        req.flash("success", "Comment updated.");
        res.redirect(redirectPath);
      }
    }
  })
);

// Delete a comment from a user's post
app.post("/:username/posts/:postId/comment/:commentId/destroy",
  requiresAuthentication,
  catchError(async (req, res, next) => {
    let postId = +req.params.postId;
    let commentId = +req.params.commentId;

    let commentUserQuery = res.locals.store.commentUser(commentId);
    let postUserQuery = res.locals.store.postUser(postId);
    let resultsAll = await Promise.all([ commentUserQuery, postUserQuery ]);
    let [ commentUser, postUser ] = resultsAll;

    if (!isAuthorized(req.session.username, [ postUser, commentUser ])) {
      req.flash("error", `Unauthorized. Redirected to ${req.session.username}'s posts.`);
      res.redirect(`/${req.session.username}/posts`);
    } else {
      let redirectPath = req.session.redirectPath;
      delete req.session.redirectPath;
  
      let deleted = await res.locals.store.deleteComment(commentId);
      if (!deleted) {
        redirectNotFound(req, res, next);
      } else {
        req.flash("success", "Comment deleted.");
        res.redirect(redirectPath);
      }
    }
  })
);

// Login to Muse
app.post("/signin",
  [
    body("username")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please enter your username.")
      .isLength({ max: 100 })
      .withMessage("Username cannot be longer than 100 characters"),
    body("password")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please enter your password.")
      .isLength({ max: 100 })
      .withMessage("Password cannot be longer than 100 characters"),
  ],
  catchError(async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(error => req.flash("error", error.msg));
      res.render("signin", { flash: req.flash(), username });
    } else {
      let valid = await res.locals.store.authenticate(username, password);

      if (!valid) {
        req.flash("error", "Invalid credentials. Please try again.");
        res.render("signin", { flash: req.flash(), username });
      } else {
        req.session.signedIn = true;
        req.session.username = username;
        req.flash("info", "Signed in.");
        if (req.session.returnTo) {
          returnPath = req.session.returnTo
          delete req.session.returnTo;

          res.redirect(returnPath);
        } else {
          res.redirect("/posts/1");
        }
      }
    }
  })
);

// Sign out of Muse
app.post("/signout", (req, res) => {
  delete req.session.signedIn;
  delete req.session.username;

  req.flash("info", "Signed out.");
  res.redirect("/signin");
});

// Error handler
app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
});

// Listener
app.listen(PORT, HOST, () => {
  console.log(`Listening to port ${PORT} on host ${HOST}...`);
});