# Muse
Muse is an online discussion forum for all things music-related. Members of Muse can read posts uploaded by other users or create their own discussion posts. 

## Versions
**Node.js**: *v16.14.2*  
**Browser**: Google Chrome *v112.0.5615.121* (Official Build) (64-bit)  
**PostgreSQL**: 10.23

## Installation
Installation is done using the `npm install` command. From the project directory, enter:
```
$ npm install
```
To run on local host, enter:
```
$ npm start
```
...and enter the following URL on your browser (port number may vary):
```
http://localhost:3000/
```
However, before starting the application, the database server (along with optional seed data) must be configured. Refer to the next section.

## Configurations
Enter the following commands to set up the application. This guide assumes PostgreSQL
has been installed for your specific operating system.

- Start the PostgreSQL database server  
    - For most Linux-based operating systems, the following command will start a PostgreSQL database server from your terminal:  
    ```
    sudo service postgresql start
    ```
- Navigating to `psql`:  
    - From the project folder directory, enter `psql` into the terminal to connect to the server. A terminal-based interface should appear.

- Enter the following command to set up the `muse` database:  
```
\i ./lib/schema.sql
```

- Then, enter the following command to create test accounts for the application:
```
\i ./lib/seed-user.sql
```
    - It should be noted that the test accounts' passwords are encrypted using the `bcrypt` npm package. Their literal passwords can be found by navigating to the `./lib/seed-user.sql` file. They are placed next to the hashed passwords.

- Finally, add any seed-data for the application by entering the following command:  
```
\i ./lib/seed-data.sql
```

The application is now ready for testing. Exit the `psql` console by entering `/q`.



## Application Requirements  
- The application must use at least two kinds of related data where one of the data types is a collection of objects of the other type.
    - A user's **post** represents a *collection*, with **comments** being the collected *objects*. There is a 1:Many relationship between **posts** and **comments**.

- The application must provide CRUD capabilities (create-read-update-delete) for both the collections and the individual objects in each collection.
    - Features include **C**reating, **R**eading, **Updating**, and **D**eleting individual posts.
    - Users can also **C**reate, **R**ead, **Update**, and **D**elete individual comments of their post.
        - To clarify, only creators of the post and the comment may edit/delete a comment.
        
- All changes (creation, updates, and deletes) should be reflected in the database.
    - The **pg-persistence.js** module is used to handle all database related operations.

- The page used to update a collection or object must have a unique URL.
    - The `/:username/posts/:postId/edit` URL is used to update a user's post.
    - The `/:username/posts/:postId/destroy` URL is used to delete a user's post.
    - The `/:username/posts/:postId/comment/:commentId/edit` URL is used to update a post's comment.
    - The `/:username/posts/:postId/comment/:commentId/destroy` URL is used to delete a post's comment.

- Listing collections requires **pagination**
    - The starting page, or `/posts/:pageNumber` implements pagination. Each page is limited to 8 posts.
    
- When listing collections or objects, sort the items consistently. For instance: alphabetically, numerically, by date, and so on.
    - Posts (and user's posts) are sorted by creation date, with newest posts sorted to the top.
    - With posts created on the same time (like the seed-data, for instance), they are sorted alphabetically.
    
- Validate input data as needed. In particular, you must prevent SQL and JavaScript injection.
    - All user input for database related operations are handled through `node-postgres`'s **parameterized queries**.
    - All user input for login, post creation, and comment creation are escaped through the Pug template engine. 
        
- Error messages should be displayed on the same page where they are raised and should be specific. If the page contains multiple inputs, you should preserve any valid data that the user has already entered.
- Display appropriate flash error messages when the user does something incorrectly.
    - Flash messaging is implemented through `express-flash`. 
    - All error flash messages are displayed at the top of the same page. A flash message is displayed for each invalid user input provided in the form.
    -  `Success` or `Info` flash messages are displayed at the redirected page.

- Validate URL parameters such as ID numbers and query strings. 
    - URL parameters are validated by determining if their associated data exists or not. If the associated data doesn't exist, an error is thrown.
    
- The application must require login authentication for all operations,
    - Every operation (most route handlers) requires login authentication.
    

## Additional Information
The `Muse` logo on the top of the screen can be used to navigate to the start
page (`/posts/1`).

I assumed that login authentication was not required when users are signing in.
Thus, I removed the `requiresAuthentication` middleware from POST `/signin`.

Many of the route handlers — such as GET `/:username/posts/:postId/edit` — will determine if a user is **authorized** to access the URL by calling the `isAuthorized` function. The function will compare the URL's `:username` parameter and the user's `username` and determine if they are same. If they are not the same, an error is thrown.
- What this ensures is that users cannot edit/delete the post or comment of other users. For instance, `userA` can enter the URL `/userB/posts/5/edit` and potentially edit `userB`'s post. `isAuthorized` prevents such possibilty.


---