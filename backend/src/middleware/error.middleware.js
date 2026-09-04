/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found - ${req.originalUrl}`
  });
};

/**
 * Centralized Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Gracefully handle client connection aborts / network drops
  if (err.code === 'ECONNABORTED' || err.type === 'request.aborted' || err.message?.includes('request aborted')) {
    console.warn('Client aborted request or socket interrupted during transfer');
    return res.status(400).json({
      success: false,
      message: 'Upload was interrupted. Please retry with the optimized photo.',
      code: 'REQUEST_ABORTED',
    });
  }

  console.error('Unhandled Application Error:', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
