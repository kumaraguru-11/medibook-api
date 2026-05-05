const authRepo = require("./auth.repo");
const userRepo = require("../users/user.repo");
const { ApiError } = require("../../utils/httpsResponse");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
} = require("../../utils/jwtToken");

exports.registerUserService = async (name, email, password) => {
  // Check missing fields
  if (!email || !password || !name) {
    throw new ApiError("All fields are required", 400);
  }

  //Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError("Invalid email format", 400);
  }

  // Check password length
  if (password.length < 6) {
    throw new ApiError("Password must be at least 6 characters", 400);
  }

  const hashedpassword = await bcrypt.hash(password, 10);

  return await userRepo.createUser(name.toLowerCase(), email, hashedpassword);
};

exports.loginUserService = async (email, password) => {
  //Check missing fields
  if (!email || !password) {
    throw new ApiError("Email and password are required", 400);
  }

  //Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError("Invalid email format", 400);
  }

  const user = await userRepo.getUserByEmail(email);
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError("Invalid credentials", 401);
  }

  // Create token payload
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // Generate tokens
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const hashedToken = await bcrypt.hash(refreshToken, 10);
  await authRepo.saveRefreshToken(user.id, hashedToken);

  delete user.password;
  delete user.refresh_token;

  // Return everything
  return {
    user,
    accessToken,
    refreshToken,
  };
};

exports.logoutUserService = async (userId) => {
  await authRepo.saveRefreshToken(userId, null);
};

exports.refreshAccessTokenService = async (token) => {
  if (!token) throw new ApiError("No token provided", 404);

  let decoded;
  try {
    decoded = validateRefreshToken(token);
  } catch (err) {
    throw new ApiError("Invalid or expired refresh token", 401);
  }

  const user = await userRepo.getUserByEmail(decoded.email);

  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (!user.refresh_token) {
    throw new ApiError("Refresh token not found. Please login again.", 401);
  }

  const isValid = await bcrypt.compare(token, user.refresh_token);
  if (!isValid) {
    throw new ApiError("Invalid refresh token", 401);
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(payload);

  return {
    accessToken: newAccessToken,
  };
};
