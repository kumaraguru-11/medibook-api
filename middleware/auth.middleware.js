const { ApiError } = require("../utils/httpsResponse");
const { validateAccessToken } = require("../utils/jwtToken");
const userRepo = require("../modules/users/user.repo");

module.exports = async (req, res, next) => {
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

    // Fetch latest user data from DB
    const user = await userRepo.getUserById(decoded.id);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    delete user.password; 
    delete user.refresh_token;
    delete user.created_at;
    // Attach user to request
    req.user = user;

    next();
  } catch (err) {
    next(err);
  }
};
