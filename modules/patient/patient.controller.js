const { ApiResponse } = require("../../utils/httpsResponse");
const patientService = require("./patient.service");

exports.createPatientProfile = async (req, res, next) => {
  try {
    const patientData = req.body;
    const createdPatientProfile =
      await patientService.createPatientProfile(patientData);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdPatientProfile,
          "Patient profile created successfully",
        ),
      );
  } catch (e) {
    next(e);
  }
};

exports.getPatientProfileByAppointmentId = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const patientProfile =
      await patientService.getPatientProfileByAppointmentId(appointmentId);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          patientProfile,
          "Patient profile fetched successfully",
        ),
      );
  } catch (e) {
    next(e);
  }
};

exports.updatePatientProfile = async (req, res, next) => {
  try {
    const patientData = req.body;
    const updatedPatientProfile =
      await patientService.updatePatientProfile(patientData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPatientProfile,
          "Patient profile updated successfully",
        ),
      );
  } catch (e) {
    next(e);
  }
};
