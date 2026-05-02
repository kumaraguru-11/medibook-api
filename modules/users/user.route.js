const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const userController = require("./user.controller");

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  userController.getUserById,
);

module.exports = router;
