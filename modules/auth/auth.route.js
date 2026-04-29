const express = require("express");
const { register, login, logout, refresh, user } = require("./auth.controller");
const authmiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refresh);
router.delete("/logout", authmiddleware, logout);
router.get("/users", authmiddleware, user);

module.exports = router;
