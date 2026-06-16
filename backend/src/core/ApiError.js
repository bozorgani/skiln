class ApiError extends Error {
  constructor(statusCode, message, errors = [], code) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;

