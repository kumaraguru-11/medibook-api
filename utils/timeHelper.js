function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");

  const minutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

/*
  Find removed ranges between old slot and new slot

  OLD: 10-12
  NEW: 11-13

  RESULT:
  [
    { start: "10:00", end: "11:00" }
  ]
*/
function findRemovedRanges(oldSlot, newSlot) {
  const removedRanges = [];

  const oldStart = timeToMinutes(oldSlot.start_time);
  const oldEnd = timeToMinutes(oldSlot.end_time);

  const newStart = timeToMinutes(newSlot.startTime);
  const newEnd = timeToMinutes(newSlot.endTime);

  // Left removed portion
  if (newStart > oldStart) {
    removedRanges.push({
      date: oldSlot.date,
      start_time: minutesToTime(oldStart),
      end_time: minutesToTime(newStart),
    });
  }

  // Right removed portion
  if (newEnd < oldEnd) {
    removedRanges.push({
      date: oldSlot.date,
      start_time: minutesToTime(newEnd),
      end_time: minutesToTime(oldEnd),
    });
  }

  return removedRanges;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  findRemovedRanges,
};
