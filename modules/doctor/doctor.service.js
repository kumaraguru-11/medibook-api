const { ApiError } = require("../../utils/httpsResponse");
const doctorRepo = require("./doctor.repo");
const userRepo = require("../users/user.repo");

exports.updateDoctorProfile = async (userId, doctorData) => {
  const existingUser = await userRepo.getUserById(userId);
  if (!existingUser) {
    throw new ApiError("User not found", 404);
  }
  if (existingUser.role !== "DOCTOR") {
    throw new ApiError("User is not a doctor", 400);
  }

  if (doctorData === undefined || Object.keys(doctorData).length === 0) {
    throw new ApiError("No fields provided to update", 400);
  }

  if (doctorData.specialty !== undefined && !doctorData.specialty.trim()) {
    throw new ApiError("Specialty cannot be empty", 400);
  }

  if (doctorData.description !== undefined && !doctorData.description.trim()) {
    throw new ApiError("Description cannot be empty", 400);
  }

  if (doctorData.experience !== undefined && doctorData.experience < 0) {
    throw new ApiError("Experience must be positive", 400);
  }

  const updatedDoctor = await doctorRepo.updateDoctor(userId, doctorData);
  return updatedDoctor;
};

exports.createDoctorAvailability = async (userId, availabilityData) => {
  const existingDoctor = await doctorRepo.getDoctorByUserId(userId);
  if (!existingDoctor) {
    throw new ApiError("Doctor not found", 404);
  }

  if (!Array.isArray(availabilityData) || availabilityData.length === 0) {
    throw new ApiError("Availability data must be a non-empty array", 400);
  }

  // Validate each slot in the availability data
  for (const slot of availabilityData) {
    if (!slot.date || !slot.startTime || !slot.endTime) {
      throw new ApiError("Each slot must have date, startTime, endTime", 400);
    }

    if (slot.startTime >= slot.endTime) {
      throw new ApiError("startTime must be less than endTime", 400);
    }
  }

  const createdAvailability = await doctorRepo.createDoctorAvailability(
    existingDoctor.id,
    availabilityData,
  );

  if (!createdAvailability) {
    throw new ApiError("Failed to create availability", 500);
  }

  return createdAvailability;
};
