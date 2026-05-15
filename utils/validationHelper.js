const { ApiError } = require("./httpsResponse");

// Convert HH:mm to seconds
function timeToSeconds(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 3600 + minutes * 60;
}

// Validate time range
function validateTimeRange(startTime, endTime) {
  if (startTime >= endTime) {
    throw new ApiError("startTime must be less than endTime", 400);
  }
}

// Validate duration
function validate30MinuteInterval(startTime, endTime, type = "Slot") {
  const startSeconds = timeToSeconds(startTime);
  const endSeconds = timeToSeconds(endTime);

  const diffMinutes = (endSeconds - startSeconds) / 60;

  if (diffMinutes < 30) {
    throw new ApiError(`${type} must be at least 30 minutes`, 400);
  }

  if (diffMinutes % 30 !== 0) {
    throw new ApiError(`${type} must be in 30 minute intervals`, 400);
  }
}

// Prevent past date/time
function validateFutureDateTime(
  date,
  startTime,
  message = "Cannot create in the past",
) {
  const dateTime = new Date(`${date}T${startTime}`);

  if (dateTime < new Date()) {
    throw new ApiError(message, 400);
  }
}

// Validate required fields
function validateRequiredFields(data, fields) {
  for (const field of fields) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      throw new ApiError(`${field} is required`, 400);
    }
  }
}

// Full slot validation
function validateSlot(slot, type = "Availability") {
  validateRequiredFields(slot, ["date", "startTime", "endTime"]);

  validateTimeRange(slot.startTime, slot.endTime);

  validate30MinuteInterval(slot.startTime, slot.endTime, type);

  validateFutureDateTime(
    slot.date,
    slot.startTime,
    `Cannot create ${type.toLowerCase()} in the past`,
  );
}

module.exports = {
  timeToSeconds,
  validateTimeRange,
  validate30MinuteInterval,
  validateFutureDateTime,
  validateRequiredFields,
  validateSlot,
};
