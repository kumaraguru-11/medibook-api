const { ApiResponse, ApiError } = require("../../utils/httpsResponse");
const doctorService = require("./doctor.service");
const doctorRepo = require("./doctor.repo");

exports.updateDoctorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const doctorData = req.body;
    const updatedDoctor = await doctorService.updateDoctorProfile(
      userId,
      doctorData,
    );
    res
      .status(200)
      .json(
        new ApiResponse(updatedDoctor, "Doctor profile updated successfully!"),
      );
  } catch (e) {
    next(e);
  }
};

exports.createDoctorAvailability = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const availabilityData = req.body;
    const createdAvailability = await doctorService.createDoctorAvailability(
      userId,
      availabilityData,
    );
    res
      .status(201)
      .json(
        new ApiResponse(
          createdAvailability,
          "Doctor availability created successfully!",
        ),
      );
  } catch (e) {
    if (e.code === "23P01") {
      return next(
        new ApiError("Availability slots overlap with existing slots", 409),
      );
    }
    next(e);
  }
};

exports.updateDoctorAvailability = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const availabilityData = req.body;
    const updatedAvailability = await doctorService.updateDoctorAvailability(
      userId,
      availabilityData,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          updatedAvailability,
          "Doctor availability updated successfully!",
        ),
      );
  } catch (e) {
    if (e.code === "23P01") {
      return next(
        new ApiError("Availability slots overlap with existing slots", 409),
      );
    }
    next(e);
  }
};

exports.getDoctorAvailability = async (req, res, next) => {
  try {
    const doctor = await doctorRepo.getDoctorByUserId(req.user.id);

    const filters = {
      doctorId: doctor.id,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      userId: req.user.id,
    };

    const availability = await doctorService.getDoctorAvailability(filters);

    res
      .status(200)
      .json(
        new ApiResponse(
          availability,
          "Doctor availability fetched successfully",
        ),
      );
  } catch (e) {
    next(e);
  }
};

exports.deleteDoctorAvailability = async (req, res, next) => {
  //payload
  //   {
  //   "availabilityIds": [6, 7],
  //   "reason": "Emergency surgery"
  // }
  try {
    const userId = req.user.id;

    const { availabilityIds, reason } = req.body;

    const deletedAvailability = await doctorService.deleteDoctorAvailability(
      userId,
      availabilityIds,
      reason,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          deletedAvailability,
          "Doctor availability deleted successfully",
        ),
      );
  } catch (e) {
    if (e.code === "23P01") {
      return next(
        new ApiError(
          "Availability deletion conflicts with existing blocked slots",
          409,
        ),
      );
    }

    next(e);
  }
};

/**
 * Select Date: [ 2026-05-06 📅 ]

Start Time: [ 10:00 AM ⏰ ]
End Time:   [ 02:00 PM ⏰ ]

Slot Duration: [ 30 min ▼ ]

[ Add Availability ]




Monday     [10:00 – 2:00]  [+ Add]
Tuesday    [10:00 – 2:00]
Wednesday  [Off]
Thursday   [4:00 – 8:00]
 */
