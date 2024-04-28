const dbQuery = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = `
    SELECT password FROM users
    WHERE username = $1
    `;

    let queryResult = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (queryResult.rowCount === 0) return false;

    return bcrypt.compare(password, queryResult.rows[0].password);
  }

  async commentsPageCount(postId) {
    const COUNT_POST_COMMENTS = `
    SELECT count(id) 
    FROM comments
    WHERE post_id = $1
    `;

    try {
      let result = await dbQuery(COUNT_POST_COMMENTS, postId);
      return Math.ceil(result.rows[0].count / 4) || 1;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async commentUser(commentId) {
    const SELECT_COMMENT_USER = `
    SELECT users.username
    FROM users
    JOIN comments ON users.id = comments.user_id
    WHERE comments.id = $1
    `;

    try {
      let result = await dbQuery(SELECT_COMMENT_USER, commentId);
      if (result.rowCount === 0) return undefined;
      return result.rows[0].username;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async createPost(...postInfo) {
    const INSERT_POST = `
    INSERT INTO posts (user_id, title, description, song, artist)
    VALUES ($1, $2, $3, $4, $5)
    `;

    try {
      let userId = await this.userId(this.username);
      let result = await dbQuery(INSERT_POST, userId, ...postInfo);
  
      return result.rowCount === 1;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async deleteComment(commentId) {
    const DELETE_COMMENT = `
    DELETE FROM comments
    WHERE id = $1
    `

    try {
      let result = await dbQuery(DELETE_COMMENT, commentId);
      return result.rowCount === 1;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async deletePost(postId) {
    const DELETE_POST = `
    DELETE FROM posts
    WHERE id = $1
    `;

    try {
      let result = await dbQuery(DELETE_POST, postId);
      return result.rowCount === 1;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async loadComment(commentId) {
    const SELECT_COMMENT = `
    SELECT 
    comments.id,
    comments.user_id,
    comments.post_id,
    users.username,
    comments.comment,
    TO_CHAR(comments.created, 'MM/DD/YYYY') AS created
    FROM comments
    JOIN users ON comments.user_id = users.id
    WHERE comments.id = $1
    `;

    try {
      let result = await dbQuery(SELECT_COMMENT, commentId);
      if (result.rowCount === 0) return undefined;
      return result.rows[0];
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async loadComments(postId, pageNumber) {
    const SELECT_COMMENTS = `
    SELECT 
    comments.id,
    users.username,
    comments.comment,
    TO_CHAR(comments.created, 'MM/DD/YYYY') AS created
    FROM comments
    JOIN users ON comments.user_id = users.id
    WHERE post_id = $1
    ORDER BY comments.created DESC, users.username ASC
    LIMIT 4
    OFFSET $2
    `;

    try {
      let offset = 4 * (pageNumber - 1);
      let results = await dbQuery(SELECT_COMMENTS, postId, offset);
      return results.rows;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async loadPost(postId) {
    const SELECT_POST = `
    SELECT user_id,
    posts.id,
    users.username,
    title,
    description,
    song,
    artist,
    TO_CHAR(posts.created, 'MM/DD/YYYY') AS created
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = $1
    `;

    try {
      let results = await dbQuery(SELECT_POST, postId);
      if (results.rowCount !== 1) return undefined;
      return results.rows[0];
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async loadPosts(pageNumber) {
    const SELECT_ALL_POSTS = `
    SELECT posts.*,
    users.username
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY created DESC, title ASC
    LIMIT 8
    OFFSET $1
    `;

    try {
      let offset = 8 * (pageNumber - 1);
      let results = await dbQuery(SELECT_ALL_POSTS, offset);
      return results.rows;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async loadUserPosts(username) {
    const SELECT_USER_POSTS = `
    SELECT * FROM posts
    WHERE user_id = $1
    ORDER BY created DESC, title ASC
    `;

    try {
      let userId = await this.userId(username);
      let result = await dbQuery(SELECT_USER_POSTS, userId);
      if (result.rowCount === 0) return undefined;
      return result.rows;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async postsPageCount() {
    const COUNT_ALL_POSTS = `
    SELECT count(id) FROM posts
    `;

    let result = await dbQuery(COUNT_ALL_POSTS);

    return Math.ceil(result.rows[0].count / 8) || 1;
  }

  async postComment(postId, comment) {
    const INSERT_COMMENT = `
    INSERT INTO comments (user_id, post_id, comment)
    VALUES ($1, $2, $3)
    `;

    try {
      let userId = await this.userId(this.username);
      let result = await dbQuery(INSERT_COMMENT, userId, postId, comment);
      return result.rowCount > 0;
    } catch (error) {
   
    }
  }

  async postUser(postId) {
    const SELECT_POST_USER = `
    SELECT users.username
    FROM users
    JOIN posts ON users.id = posts.user_id
    WHERE posts.id = $1
    `;

    try {
      let result = await dbQuery(SELECT_POST_USER, postId);
      if (result.rowCount === 0) return undefined;
      return result.rows[0].username;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async updateComment(commentId, commentInfo) {
    const UPDATE_COMMENT = `
    UPDATE comments
    SET comment = $2
    WHERE id = $1
    `;

    try {
      let result = await dbQuery(UPDATE_COMMENT, commentId, commentInfo);
      return result.rowCount === 1;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async updatePost(...postInfo) {
    const UPDATE_POST = `
    UPDATE posts
    SET title = $2,
    description = $3,
    song = $4,
    artist = $5
    WHERE id = $1 AND user_id = $6
    `;

    try {
      let userId = await this.userId(this.username);
      let result = await dbQuery(UPDATE_POST, ...postInfo, userId);
      return result.rowCount === 1;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async userExists(username) {
    const SELECT_USER = `
    SELECT * FROM users
    WHERE username = $1
    `;

    try {
      let result = await dbQuery(SELECT_USER, username);
      return result.rowCount === 1;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return undefined;
      } else {
        throw error;
      }
    }
  }

  async userId(username) {
    const FIND_USER_ID = `
    SELECT id FROM users
    WHERE username = $1
    `;

    let result = await dbQuery(FIND_USER_ID, username);

    return result.rows[0].id;
  }

  _isInvalidInputSyntax(error) {
    return /invalid input syntax for type/.test(String(error));
  }
}