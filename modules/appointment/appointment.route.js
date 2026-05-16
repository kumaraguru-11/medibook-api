const express = require("express");
const appointmentController = require("./appointment.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const allowRoles = require("../../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", allowRoles("USER"), appointmentController.createAppointment);

router.get(
  "/",
  allowRoles("USER", "DOCTOR"),
  appointmentController.getAppointment,
);

router.patch(
  "/:id/cancel",
  allowRoles("USER"),
  appointmentController.cancelAppointment,
);

module.exports = router;
