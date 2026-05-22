const { ApiError } = require("../../utils/httpsResponse");
const {
  formatAvailabilityResponse,
} = require("../../utils/availabilityFormatter");

const doctorRepo = require("./doctor.repo");

const { validateSlot } = require("../../utils/validationHelper");

exports.updateDoctorProfile = async (userId, doctorData) => {
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

  for (const slot of availabilityData) {
    validateSlot(slot, "Availability");
  }

  const createdAvailability = await doctorRepo.createDoctorAvailability(
    existingDoctor.id,
    availabilityData,
  );

  if (!createdAvailability || createdAvailability.length === 0) {
    throw new ApiError("Failed to create availability", 500);
  }

  return createdAvailability;
};

exports.updateDoctorAvailability = async (userId, availabilityData) => {
  const existingDoctor = await doctorRepo.getDoctorByUserId(userId);

  if (!existingDoctor) {
    throw new ApiError("Doctor not found", 404);
  }

  if (!Array.isArray(availabilityData) || availabilityData.length === 0) {
    throw new ApiError("Availability data must be a non-empty array", 400);
  }

  const slotIds = availabilityData.map((slot) => slot.id);

  const existingSlots = await doctorRepo.checkSlotsByIds(
    existingDoctor.id,
    slotIds,
  );

  if (existingSlots.length !== slotIds.length) {
    throw new ApiError(
      "One or more slots do not exist or do not belong to the doctor",
      400,
    );
  }

  for (const slot of availabilityData) {
    validateSlot(slot, "Availability");
  }

  return await doctorRepo.updateAvailabilityAndHandleAppointments(
    existingDoctor.id,
    existingSlots,
    availabilityData,
  );
};

exports.getDoctorAvailability = async (filters) => {
  filters.hidePast = false;

  const rows = await doctorRepo.getAvailability(filters);

  return formatAvailabilityResponse(rows, filters.userId);
};

exports.deleteDoctorAvailability = async (userId, availabilityIds, reason) => {
  const existingDoctor = await doctorRepo.getDoctorByUserId(userId);

  if (!existingDoctor) {
    throw new ApiError("Doctor not found", 404);
  }

  if (!Array.isArray(availabilityIds) || availabilityIds.length === 0) {
    throw new ApiError("availabilityIds must be a non-empty array", 400);
  }

  const existingSlots = await doctorRepo.checkSlotsByIds(
    existingDoctor.id,
    availabilityIds,
  );

  if (existingSlots.length !== availabilityIds.length) {
    throw new ApiError("One or more availability slots not found", 404);
  }

  return await doctorRepo.deleteAvailabilityAndHandleAppointments(
    existingDoctor.id,
    existingSlots,
    reason,
  );
};