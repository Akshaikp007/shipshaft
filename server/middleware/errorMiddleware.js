/**
 * Middleware to handle 404 (Not Found) routes.
 * Creates an error and forwards it to the centralized error handler.
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized error handler middleware.
 * Formats errors and sends a JSON response to the client.
 */
export const errorHandler = (err, req, res, next) => {
  // If the status code is 200, default to 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
