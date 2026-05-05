const pool = require("../../config/db");

exports.getDoctorByUserId = async (userId) => {
  const query = `SELECT * FROM doctors where user_id = $1`;
  const values = [userId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.createDoctor = async (userId) => {
  const query = `
    INSERT INTO doctors (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

exports.updateDoctor = async (userId, doctorData) => {
  const allowedFields = ["specialty", "experience", "description"];
  const fields = [];
  const values = [];
  let index = 1;

  for (const key of allowedFields) {
    if (doctorData[key] !== undefined) {
      fields.push(`${key}=$${index}`);
      values.push(doctorData[key]);
      index++;
    }
  }

  const query = `
  UPDATE doctors
  SET ${fields.join(", ")}
    WHERE user_id = $${index}
    RETURNING *;
  `;

  values.push(userId);

  const { rows } = await pool.query(query, values);
  return rows[0];
};

exports.createDoctorAvailability = async (doctorId, availabilityData) => {
  const date = availabilityData.map((slot) => slot.date);
  const startTime = availabilityData.map((slot) => slot.startTime);
  const endTime = availabilityData.map((slot) => slot.endTime);

  const query = `
    INSERT INTO availability (doctor_id, date, start_time, end_time)
    SELECT $1, unnest($2::date[]), unnest($3::time[]), unnest($4::time[])
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [
    doctorId,
    date,
    startTime,
    endTime,
  ]);
  return rows;
};
