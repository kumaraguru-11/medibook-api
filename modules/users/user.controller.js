const { ApiResponse } = require("../../utils/httpsResponse");
const userService = require("./user.service");

exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.user;
    const user = await userService.getUserById(userId);
    res.status(200).json(new ApiResponse(user, "User found successfully!"));
  } catch (e) {
    next(e);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.user;
    const userData = req.body;
    const updatedUser = await userService.updateUser(userId?.id, userData);
    res
      .status(200)
      .json(new ApiResponse(updatedUser, "User updated successfully!"));
  } catch (e) {
    next(e);
  }
};

exports.getUserAvailability = async (req, res, next) => {
  try {
    const filters = {
      doctorId: req.query.doctorId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      specialty: req.query.specialty,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      userId: req.user.id,
    };

    const availability = await userService.getUserAvailability(filters);

    res
      .status(200)
      .json(new ApiResponse(availability, "Availability fetched successfully"));
  } catch (e) {
    next(e);
  }
};