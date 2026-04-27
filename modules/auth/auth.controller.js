const authService = require("./auth.service");
const { ApiError, ApiResponse } = require("../../utils/httpsResponse");

exports.register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const newUser = await authService.registerUserService(
      email,
      password,
      role,
    );
    res
      .status(201)
      .json(new ApiResponse(newUser, "User register successfully!"));
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUserService(email, password);

    res.status(200).json(new ApiResponse(user, "Login successful!"));
  } catch (e) {
    next(e);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logoutUserService(req.user.id);

    res.status(200).json(new ApiResponse(null, "Logged out successfully"));
  } catch (e) {
    next(e);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessTokenService(refreshToken);

    res
      .status(200)
      .json(new ApiResponse(result, "Access token refreshed successfully"));
  } catch (e) {
    next(e);
  }
};
