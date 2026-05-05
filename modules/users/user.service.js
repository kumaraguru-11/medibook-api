const { ApiError } = require("../../utils/httpsResponse");
const userRepo = require("./user.repo");
const doctorRepo = require("../doctor/doctor.repo");

exports.getUserById = async (user) => {
  const { id } = user;

  if (!id) {
    throw new ApiError("User ID is required", 400);
  }

  const existingUser = await userRepo.getUserById(id);

  if (!existingUser) {
    throw new ApiError("User not found", 404);
  }

  if (existingUser.role === "DOCTOR") {
    const doctorDetails = await doctorRepo.getDoctorByUserId(id);
    return {
      id: existingUser.id,
      name: existingUser.name,
      role: existingUser.role,
      email: existingUser.email,

      //doctors fields
      specialty: doctorDetails.specialty,
      experience: doctorDetails.experience,
      verification_status: doctorDetails.verification_status,
      description: doctorDetails.description,
    };
  }

  return {
    id: existingUser.id,
    name: existingUser.name,
    role: existingUser.role,
    email: existingUser.email,
  };
};

exports.updateUser = async (userId, userData) => {
  const existingUser = await userRepo.getUserById(userId);
  if (!existingUser) {
    throw new ApiError("User not found", 404);
  }
  const updatedUser = await userRepo.updateUser(userId, userData);

  // Create doctor profile if role is updated to DOCTOR and no existing doctor profile exists
  if (userData.role === "DOCTOR" && existingUser.role !== "DOCTOR") {
    const doctorProfile = await doctorRepo.getDoctorByUserId(userId);

    if (!doctorProfile) {
      await doctorRepo.createDoctor(userId, {});
    }
  }

  delete updatedUser.password;
  delete updatedUser.refresh_token;

  return updatedUser;
};
