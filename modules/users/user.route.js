const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const userController = require("./user.controller");
const allowRoles = require("../../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/me", userController.getUserById);
router.patch(
  "/me",
  allowRoles("USER", "UNASSIGNED"),
  userController.updateUser,
);
router.get(
  "/availiability",
  allowRoles("USER"),
  userController.getUserAvailability,
);

module.exports = router;
