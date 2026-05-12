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

exports.getAppointment = async (req, res, next) => {
  try {
    const filters = {
      user_id: req.query.userId,
      doctor_id: req.query.doctorId,
      status: req.query.status,
      appointment_date: req.query.date,
    };

    const appointments = await appointmentService.getAppointments(filters);

    return res
      .status(200)
      .json(new ApiResponse("Appointments fetched successfully", appointments));
  } catch (e) {
    next(e);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const appointmentId = req.params.id;

    const appointment = await appointmentService.cancelAppointment(
      userId,
      appointmentId,
    );

    return res
      .status(200)
      .json(new ApiResponse("Appointment cancelled successfully"));
  } catch (e) {
    next(e);
  }
};
