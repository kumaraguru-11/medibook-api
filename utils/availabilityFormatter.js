function add30Minutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  date.setMinutes(date.getMinutes() + 30);

  return date.toTimeString().slice(0, 5);
}

function generate30MinuteSlots(row, currentUserId) {
  const slots = [];

  let currentStart = row.start_time.slice(0, 5);

  while (currentStart < row.end_time.slice(0, 5)) {
    const currentEnd = add30Minutes(currentStart);

    const bookedAppointment = row.appointments.find(
      (appointment) =>
        ["SCHEDULED", "COMPLETED"].includes(appointment.status) &&
        appointment.start_time.slice(0, 5) === currentStart &&
        appointment.end_time.slice(0, 5) === currentEnd,
    );

    slots.push({
      startTime: currentStart,
      endTime: currentEnd,

      // any user booked this slot
      isBooked: !!bookedAppointment,

      // current logged user booked this slot
      isMyBooking: bookedAppointment?.user_id === currentUserId,
    });

    currentStart = currentEnd;
  }

  return slots;
}

function formatAvailabilityResponse(rows, currentUserId) {
  return rows.map((row) => ({
    id: row.id,

    doctor: {
      id: row.doctor_id,
      name: row.doctor_name,
      specialty: row.specialty,
    },

    date: row.date,

    availability: {
      startTime: row.start_time,
      endTime: row.end_time,
    },

    slots: generate30MinuteSlots(row, currentUserId),
  }));
}

module.exports = {
  formatAvailabilityResponse,
};
