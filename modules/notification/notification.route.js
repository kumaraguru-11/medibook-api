const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const notificationController = require("./notification.controller");
const allowRoles = require("../../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("USER"));
router.get("/", notificationController.getNotifications);

module.exports = router;
