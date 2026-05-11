exports.errorHandler = (err, req, res, next) => {
  console.error(err); // debugging ke liye

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};