const notificationService = require("./notification.service");
const { ApiResponse } = require("../../utils/httpsResponse");

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = await notificationService.getNotifications(userId);

    res
      .status(200)
      .json(
        new ApiResponse(notifications, "Notifications fetched successfully"),
      );
  } catch (e) {
    next(e);
  }
};
