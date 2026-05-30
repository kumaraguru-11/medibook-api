const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const allowRoles = require("../../middleware/role.middleware");
const doctorController = require("./doctor.controller");

const router = express.Router();

// USER can view doctors
router.get(
  "/doctors",
  authMiddleware,
  allowRoles("USER"),
  doctorController.getAllDoctors,
);
router.get(
  "/specialties",
  authMiddleware,
  allowRoles("USER"),
  doctorController.getDoctorSpecialties,
);

// All routes below only for DOCTOR
router.use(authMiddleware, allowRoles("DOCTOR"));

router.patch("/me", doctorController.updateDoctorProfile);
router.post("/availability", doctorController.createDoctorAvailability);
router.put("/availability", doctorController.updateDoctorAvailability);
router.get("/availability", doctorController.getDoctorAvailability);
router.delete("/availability", doctorController.deleteDoctorAvailability);

module.exports = router;
