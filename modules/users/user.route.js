const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const userController = require("./user.controller");
const allowRoles = require("../../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/me", userController.getUserById);
router.patch("/me", allowRoles(["USER"]), userController.updateUser);

module.exports = router;
