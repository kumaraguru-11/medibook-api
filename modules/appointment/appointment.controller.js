const { ApiResponse } = require("../../utils/httpsResponse");
const appointmentService = require("./appointment.service");

exports.createAppointment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const appointmentData = req.body;
    const createdAppointment = await appointmentService.createAppointment(
      userId,
      appointmentData,
    );
    res
      .status(201)
      .json(
        new ApiResponse("Appointment created successfully", createdAppointment),
      );
  } catch (error) {
    // PostgreSQL exclusion constraint violation
    if (error.code === "23P01") {
      return next(new ApiError("Selected slot is already booked", 409));
    }
    next(error);
  }
};
