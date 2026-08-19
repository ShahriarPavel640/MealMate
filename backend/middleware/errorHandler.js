import logger from "../utils/logger.js";

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (err.isOperational) {
    logger.warn({ message: err.message, stack: err.stack, path: req.originalUrl });
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error({ message: err.message, stack: err.stack, path: req.originalUrl });
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: "Something went wrong!",
    });
  }
};

export { AppError, errorHandler };
