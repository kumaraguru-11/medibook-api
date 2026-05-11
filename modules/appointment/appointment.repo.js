const pool = require("../../config/db");

exports.createAppointment = async (userId, appointmentData) => {
  const query = `
   INSERT INTO appointments
   (doctor_id,user_id,appointment_date,start_time,end_time)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING *;
  `;
  const values = [
    appointmentData.doctor_id,
    userId,
    appointmentData.appointment_date,
    appointmentData.start_time,
    appointmentData.end_time,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

exports.getAppointmentsByUserId = async (userId) => {
  const query = `
    SELECT * FROM appointments WHERE user_id = $1
    `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
};

exports.getAppointmentsByDoctorId = async (doctorId) => {
  const query = `
    SELECT * FROM appointments WHERE doctor_id = $1
    `;

  const { rows } = await pool.query(query, [doctorId]);
  return rows;
};
