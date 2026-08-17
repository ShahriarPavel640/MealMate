import logger from "../utils/logger.js";

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Identifies expected errors vs programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (err.isOperational) {
    logger.warn(`Operational Error: ${err.message}`, { path: req.path, statusCode: err.statusCode });
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  } else {
    // Programming or other unknown errors: don't leak details
    logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack, path: req.path });
    res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  }
};
