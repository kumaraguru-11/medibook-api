const { ApiResponse } = require("../../utils/httpsResponse");
const doctorService = require("./doctor.service");

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
      availabilityData
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          updatedAvailability,
          "Doctor availability updated successfully!"
        )
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
