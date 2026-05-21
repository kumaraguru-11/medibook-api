const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const allowRoles = require("../../middleware/role.middleware");
const doctorController = require("./doctor.controller");

const router = express.Router();

router.use(authMiddleware, allowRoles("DOCTOR","USER"));

router.patch("/me", doctorController.updateDoctorProfile);
router.post("/availability", doctorController.createDoctorAvailability);
router.patch("/availability", doctorController.updateDoctorAvailability);
router.get("/availiability",doctorController.getAvailiability);

module.exports = router;
