const jwt = require("jsonwebtoken");
const { ApiError } = require("./httpsResponse");
const { access_secret, refresh_secret } = require("../config/env");

const access_expiry = "15m";
const refresh_expiry = "7d";

exports.generateAccessToken = (data) => {
  return jwt.sign(data, access_secret, {
    expiresIn: access_expiry,
  });
};

exports.generateRefreshToken = (data) => {
  return jwt.sign(data, refresh_secret, {
    expiresIn: refresh_expiry,
  });
};

exports.validateAccessToken = (token) => {
  if (!token) throw new ApiError("No token provided!", 400);

  try {
    return jwt.verify(token, access_secret);
  } catch (e) {
    throw new ApiError("Invalid or expired token", 401);
  }
};

exports.validateRefreshToken = (token) => {
  if (!token) throw new ApiError("No token provided!", 400);
  try {
    return jwt.verify(token, refresh_secret);
  } catch (e) {
    throw new ApiError("Invalid or expired token", 401);
  }
};
