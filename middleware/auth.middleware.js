const { ApiError } = require("../utils/httpsResponse");
const { validateAccessToken } = require("../utils/jwtToken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError("Unauthorized: No token provided", 401);
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    //Verify token
    const decoded = validateAccessToken(token);

    // 3. Attach user to request
    req.user = decoded;

    next();
  } catch (err) {
    next(err);
  }
};
