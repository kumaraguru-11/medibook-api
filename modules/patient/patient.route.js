const express = require("express");
const patientController = require("./patient.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const allowRoles = require("../../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, allowRoles(["USER"]));

router.post("/create", patientController.createPatientProfile);
router.get(
  "/:appointmentId",
  patientController.getPatientProfileByAppointmentId,
);
router.put("/update", patientController.updatePatientProfile);

module.exports = router;
