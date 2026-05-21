const { ApiError } = require("../../utils/httpsResponse");
const patientRepo = require("./patient.repo");

exports.createPatientProfile = async (patientData) => {
  if (patientData === undefined || Object.keys(patientData).length === 0) {
    throw new ApiError("No fields provided to create patient profile", 400);
  }

  if (patientData?.appointmentId === undefined) {
    throw new ApiError(
      "appointment_id is required to create patient profile",
      400,
    );
  }

  return await patientRepo.createPatientProfile(patientData);
};

exports.getPatientProfileByAppointmentId = async (appointmentId) => {
  if (!appointmentId) {
    throw new ApiError(
      "appointment_id is required to fetch patient profile",
      400,
    );
  }

  return await patientRepo.getPatientProfileByAppointmentId(appointmentId);
};

exports.updatePatientProfile = async (patientData) => {
  if (patientData === undefined || Object.keys(patientData).length === 0) {
    throw new ApiError("No fields provided to update patient profile", 400);
  }

  if (patientData?.appointmentId === undefined) {
    throw new ApiError(
      "appointment_id is required to update patient profile",
      400,
    );
  }

  return await patientRepo.updatePatientProfile(patientData);
};
