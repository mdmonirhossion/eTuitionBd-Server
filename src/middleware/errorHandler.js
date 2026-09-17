export const errorHandler = (err, req, res, next) => {
  console.error('Server Error Stack:', err.stack || err);

  // Handle Mongoose CastError (e.g. invalid ObjectId format like demo_app_123)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ID format for ${err.path}: "${err.value}"`,
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
