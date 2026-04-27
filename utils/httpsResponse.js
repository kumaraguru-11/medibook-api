class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ApiResponse {
  constructor(data, message = "success") {
    this.success = true;
    this.data = data;
    this.message = message;
  }
}

module.exports = { ApiError, ApiResponse };
