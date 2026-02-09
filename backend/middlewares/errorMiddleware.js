export const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || "Internal server error.",
  });
};
