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
    throw new ApiError("start_time must be less than end_time", 400);
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
