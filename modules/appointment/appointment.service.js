const { ApiError } = require("../../utils/httpsResponse");
const appointmentRepo = require("./appointment.repo");
const doctorRepo = require("../doctor/doctor.repo");
const {
  validateRequiredFields,
  validateTimeRange,
  validate30MinuteInterval,
  validateFutureDateTime,
} = require("../../utils/validationHelper");

exports.createAppointment = async (userId, appointmentData) => {
  if (!appointmentData || Object.keys(appointmentData).length === 0) {
    throw new ApiError("Appointment data is required", 400);
  }

  validateRequiredFields(appointmentData, [
    "doctor_id",
    "appointment_date",
    "start_time",
    "end_time",
  ]);

  validateTimeRange(appointmentData.start_time, appointmentData.end_time);

  validate30MinuteInterval(
    appointmentData.start_time,
    appointmentData.end_time,
    "Appointment",
  );

  validateFutureDateTime(
    appointmentData.appointment_date,
    appointmentData.start_time,
    "Cannot book appointment in the past",
  );

  const doctor = await doctorRepo.getDoctorById(appointmentData.doctor_id);

  if (!doctor) {
    throw new ApiError("Doctor not found", 404);
  }

  if (doctor.user_id === userId) {
    throw new ApiError("Doctors cannot book their own appointments", 400);
  }

  const isAvailabilityExists =
    await doctorRepo.checkAvailabilityExists(appointmentData);

  if (Object.keys(isAvailabilityExists).length === 0) {
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

  if (filters.status && !allowedStatuses.includes(filters.status)) {
    throw new ApiError("Invalid appointment status", 400);
  }

  if (filters.doctorId) {
    const doctor = await doctorRepo.getDoctorByUserId(filters.doctorId);
    if (!doctor) {
      throw new ApiError("Doctor not found", 404);
    }

    filters.doctorId = doctor.id;
  }

  // auto change the status SCHEDULED -> COMPLETED
  await appointmentRepo.syncCompletedAppointments();

  return await appointmentRepo.getAppointments(filters);
};

exports.cancelAppointment = async (userId, appointmentId) => {
  if (!appointmentId) {
    throw new ApiError("Appointment id is required", 400);
  }

  const appointment = await appointmentRepo.getAppointmentById(appointmentId);

  if (!appointment) {
    throw new ApiError("Appointment not found", 404);
  }

  if (appointment.user_id !== userId) {
    throw new ApiError("You are not allowed to cancel this appointment", 403);
  }

  if (appointment.status === "CANCELLED") {
    throw new ApiError("Appointment already cancelled", 400);
  }

  if (appointment.status === "COMPLETED") {
    throw new ApiError("Completed appointment cannot be cancelled", 400);
  }

  const appointmentDateTime = new Date(
    `${appointment.appointment_date}T${appointment.start_time}`,
  );

  if (appointmentDateTime < new Date()) {
    throw new ApiError("Past appointments cannot be cancelled", 400);
  }

  return await appointmentRepo.cancelAppointment(appointmentId);
};
