const { ApiError } = require("../../utils/httpsResponse");
const userRepo = require("./user.repo");

exports.getUserById = async (user) => {
  const { id, role } = user;

  if (!id) {
    throw new ApiError("User ID is required", 400);
  }

  const existingUser = await userRepo.getUserById(id);

  if (!existingUser) {
    throw new ApiError("User not found", 404);
  }

  if (existingUser.role === "DOCTOR") {
    return {
      id: existingUser.id,
      name: existingUser.name,
      role: existingUser.role,
      specialty: existingUser.specialty,
      experience: existingUser.experience,
      verification_status: existingUser.verification_status,
      description: existingUser.description,
      email: existingUser.email,
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
  console.log(existingUser)
  if (!existingUser) {
    throw new ApiError("User not found", 404);
  }
  const updatedUser = await userRepo.updateUser(userId, userData);
  return updatedUser;
};