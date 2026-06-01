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

    INNER JOIN doctors d 
      ON d.id = a.doctor_id

    INNER JOIN users u 
      ON u.id = d.user_id

    LEFT JOIN patient_details pd 
      ON pd.appointment_id = a.id

    WHERE 1 = 1
  `;

  let countQuery = `
    SELECT COUNT(*) 
    FROM appointments a
    WHERE 1 = 1
  `;

  const values = [];
  let index = 1;


  if (filters.userId) {
    query += ` AND a.user_id = $${index}`;
    countQuery += ` AND a.user_id = $${index}`;
    values.push(filters.userId);
    index++;
  }

  if (filters.doctorId) {
    query += ` AND a.doctor_id = $${index}`;
    countQuery += ` AND a.doctor_id = $${index}`;
    values.push(filters.doctorId);
    index++;
  }

  if (filters.status) {
    query += ` AND a.status = $${index}`;
    countQuery += ` AND a.status = $${index}`;
    values.push(filters.status);
    index++;
  }

  if (filters.appointmentDate) {
    query += ` AND a.appointment_date = $${index}`;
    countQuery += ` AND a.appointment_date = $${index}`;
    values.push(filters.appointmentDate);
    index++;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  query += `
    ORDER BY
      a.appointment_date ASC,
      a.start_time ASC

    LIMIT $${index}
    OFFSET $${index + 1}
  `;

  const dataValues = [...values, limit, offset];

  const [appointmentsResult, countResult] = await Promise.all([
    pool.query(query, dataValues),
    pool.query(countQuery, values),
  ]);

  const total = Number(countResult.rows[0].count);

  return {
    appointments: appointmentsResult.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
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

exports.getAppointmentsOutsideAvailability = async (
  client,
  doctorId,
  dates,
) => {
  const query = `
    SELECT a.*
    FROM appointments a
    WHERE a.doctor_id = $1
      AND a.appointment_date = ANY($2::date[])
      AND a.status = 'SCHEDULED'

      AND NOT EXISTS (
        SELECT 1
        FROM availability av
        WHERE av.doctor_id = a.doctor_id
          AND av.date = a.appointment_date
          AND a.start_time >= av.start_time
          AND a.end_time <= av.end_time
      )
  `;

  const { rows } = await client.query(query, [doctorId, dates]);

  return rows;
};


exports.markAppointmentsForReschedule = async (client, appointmentIds) => {
  if (!appointmentIds.length) return [];

  const query = `
    UPDATE appointments
    SET
      status = 'RESCHEDULE_REQUIRED',
      priority = TRUE
    WHERE id = ANY($1::int[])
    RETURNING *;
  `;

  const { rows } = await client.query(query, [appointmentIds]);

  return rows;
};

exports.syncCompletedAppointments = async () => {
  const query = `
      UPDATE appointments
      SET status = 'COMPLETED'
      WHERE status = 'SCHEDULED'
      AND (
        appointment_date < CURRENT_DATE
        OR (
          appointment_date = CURRENT_DATE
          AND end_time < CURRENT_TIME
        )
      )
    `;

  await pool.query(query);
};
