const { ApiError } = require("../utils/httpsResponse");

const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError("Unauthorized", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError("Forbidden: Access denied", 403);
    }

    next();
  };
};

module.exports = allowRoles;
