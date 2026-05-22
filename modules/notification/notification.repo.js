const pool = require("../../config/db");

exports.getAffectedAppointmentNotifications = async (userId) => {
  const query = `
    SELECT
      a.id AS appointment_id,
      a.appointment_date,
      a.start_time AS appointment_start_time,
      a.end_time AS appointment_end_time,
      a.status,
      a.priority,

      d.id AS doctor_id,
      d.specialty,

      u.name AS doctor_name,

      db.id AS block_id,
      db.date AS blocked_date,
      db.start_time AS blocked_start_time,
      db.end_time AS blocked_end_time,
      db.reason,
      db.created_at AS blocked_created_at

    FROM appointments a

    INNER JOIN doctors d
      ON d.id = a.doctor_id

    INNER JOIN users u
      ON u.id = d.user_id

    INNER JOIN doctor_blocks db
      ON db.doctor_id = a.doctor_id
      AND db.date = a.appointment_date
      AND db.start_time < a.end_time
      AND db.end_time > a.start_time

    WHERE a.user_id = $1
      AND a.status = 'RESCHEDULE_REQUIRED'

    ORDER BY
      db.created_at DESC,
      a.appointment_date ASC,
      a.start_time ASC;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows;
};
