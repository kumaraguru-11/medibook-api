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

exports.getAppointments = async (filters) => {
  let query = `
  SELECT 
    a.id,
    a.doctor_id,
    a.user_id,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.status,
    a.priority,
    a.created_at,

    d.specialty,
    d.experience,
    d.description,
    d.verification_status,

    u.name AS doctor_name,
    u.email,

    pd.name AS patient_name,
    pd.age,
    pd.gender

  FROM appointments a 
  INNER JOIN doctors d ON d.id = a.doctor_id
  INNER JOIN users u ON u.id = a.user_id
  INNER JOIN patient_details pd ON pd.appointment_id = a.id
  WHERE 1 = 1
  `;

  const values = [];
  let index = 1;

  if (filters.user_id) {
    query += `AND a.user_id = $${index}`;
    values.push(filters.user_id);
    index++;
  }

  // Filter by doctor_id
  if (filters.doctor_id) {
    query += ` AND a.doctor_id = $${index}`;
    values.push(filters.doctor_id);
    index++;
  }

  // Filter by status
  if (filters.status) {
    query += ` AND a.status = $${index}`;
    values.push(filters.status);
    index++;
  }

  // Filter by appointment date
  if (filters.appointment_date) {
    query += ` AND a.appointment_date = $${index}`;
    values.push(filters.appointment_date);
    index++;
  }

  query += `
    ORDER BY
      a.appointment_date ASC,
      a.start_time ASC
  `;

  const { rows } = await pool.query(query, values);

  return rows;
};

exports.getAppointmentById = async (appointmentId) => {
  const query = `
    SELECT *
    FROM appointments
    WHERE id = $1
    LIMIT 1;
  `;

  const values = [appointmentId];

  const { rows } = await pool.query(query, values);

  return rows[0];
};

exports.cancelAppointment = async (appointmentId) => {
  const query = `
    UPDATE appointments
    SET status = 'CANCELLED'
    WHERE id = $1
    RETURNING *;
  `;

  const values = [appointmentId];

  const { rows } = await pool.query(query, values);

  return rows[0];
};
