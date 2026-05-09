const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const allowRoles = require("../../middleware/role.middleware");
const doctorController = require("./doctor.controller");

const router = express.Router();

router.patch(
  "/me",
  authMiddleware,
  allowRoles("DOCTOR"),
  doctorController.updateDoctorProfile,
);
router.post(
  "/availability",
  authMiddleware,
  allowRoles("DOCTOR"),
  doctorController.createDoctorAvailability,
);
router.patch(
  "/availability",
  authMiddleware,
  allowRoles("DOCTOR"),
  doctorController.updateDoctorAvailability
);

module.exports = router;
