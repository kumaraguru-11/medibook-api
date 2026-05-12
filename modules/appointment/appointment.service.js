const { ApiError } = require("../../utils/httpsResponse");
const appointmentRepo = require("./appointment.repo");
const doctorRepo = require("../doctor/doctor.repo");

const { ApiError } = require("../../utils/httpsResponse");

const appointmentRepo = require("./appointment.repo");
const doctorRepo = require("../doctor/doctor.repo");

exports.createAppointment = async (userId, appointmentData) => {
  if (!appointmentData || Object.keys(appointmentData).length === 0) {
    throw new ApiError("Appointment data is required", 400);
  }

  const requiredFields = [
    "doctor_id",
    "appointment_date",
    "start_time",
    "end_time",
  ];

  for (const field of requiredFields) {
    if (!appointmentData[field]) {
      throw new ApiError(`${field} is required`, 400);
    }
  }

  // Validate time range
  if (appointmentData.start_time >= appointmentData.end_time) {
    throw new ApiError("startTime must be less than endTime", 400);
  }

  // Check doctor exists
  const doctor = await doctorRepo.getDoctorById(appointmentData.doctor_id);

  if (!doctor) {
    throw new ApiError("Doctor not found", 404);
  }

  // Prevent doctor booking themselves
  if (doctor.user_id === userId) {
    throw new ApiError("Doctors cannot book their own appointments", 400);
  }

  // Check appointment inside availability
  const isAvailabilityExists =
    await doctorRepo.checkAvailabilityExists(appointmentData);

  if (!isAvailabilityExists) {
    throw new ApiError("Doctor is not available for selected time", 400);
  }

  const createdAppointment = await appointmentRepo.createAppointment(
    userId,
    appointmentData,
  );

  return createdAppointment;
};

exports.getAppointments = async (filters) => {
  const allowedStatuses = [
    "SCHEDULED",
    "COMPLETED",
    "CANCELLED",
    "RESCHEDULE_REQUIRED",
  ];

  // Validate status
  if (filters.status && !allowedStatuses.includes(filters.status)) {
    throw new ApiError("Invalid appointment status", 400);
  }

  const appointments = await appointmentRepo.getAppointments(filters);

  return appointments;
};

exports.cancelAppointment = async (userId, appointmentId) => {
  if (!appointmentId) {
    throw new ApiError("Appointment id is required", 400);
  }

  const appointment = await appointmentRepo.getAppointmentById(appointmentId);

  // Check appointment exists
  if (!appointment) {
    throw new ApiError("Appointment not found", 404);
  }

  // Check ownership
  if (appointment.user_id !== userId) {
    throw new ApiError("You are not allowed to cancel this appointment", 403);
  }

  // Already cancelled
  if (appointment.status === "CANCELLED") {
    throw new ApiError("Appointment already cancelled", 400);
  }

  // Completed appointment cannot cancel
  if (appointment.status === "COMPLETED") {
    throw new ApiError("Completed appointment cannot be cancelled", 400);
  }

  // Prevent cancelling past appointments
  const appointmentDateTime = new Date(
    `${appointment.appointment_date}T${appointment.start_time}`,
  );

  if (appointmentDateTime < new Date()) {
    throw new ApiError("Past appointments cannot be cancelled", 400);
  }

  const cancelledAppointment =
    await appointmentRepo.cancelAppointment(appointmentId);

  return cancelledAppointment;
};
