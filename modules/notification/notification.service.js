const notificationRepo = require("./notification.repo");

exports.getNotifications = async (userId) => {
  const notifications =
    await notificationRepo.getAffectedAppointmentNotifications(userId);

  return notifications;
};
