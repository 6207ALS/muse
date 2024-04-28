/*
1. With a handler function as the argument, catchError returns a middleware.
2. When returned middleware is invoked, it Promise.resolve() the passed in 
handler function - assuming that the function is asynchronous
3. If handler function throws an error, the .catch() method catches the error
and passes it to next().
*/

const catchError = handler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  }
}

module.exports = catchError;