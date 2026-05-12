const pool = require("../../config/db");

exports.getDoctorByUserId = async (userId) => {
  const query = `SELECT * FROM doctors where user_id = $1`;
  const values = [userId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.getDoctorById = async (doctorId) => {
  const query = `SELECT * FROM doctors where id = $1`;
  const values = [doctorId];
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

exports.checkSlotsByIds = async (doctorId, slotIds) => {
  const query = `
  SELECT * FROM availability
  WHERE doctor_id = $1 AND id = ANY($2::int[])
  `;

  const { rows } = await pool.query(query, [doctorId, slotIds]);
  return rows;
};

exports.checkAvailabilityExists = async (availability) => {
  const query = `
  SELECT *
  FROM availability
  WHERE doctor_id = $1
  AND date = $2
  AND start_time <= $3
  AND end_time >= $4
  AND status = 'AVAILABLE'
  LIMIT 1;
  `;

  const values = [
    availability.doctor_id,
    availability.appointment_date,
    availability.start_time,
    availability.end_time,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

// exports.updateDoctorAvailability = async (doctorId, availibilityData) => {
//   const client = await pool.connect();
//   try {
//     await client.query("BEGIN");
//     const updatedRows = [];

//     for (const slot of availibilityData) {
//       const fields = [];
//       const values = [];
//       let index = 1;

//       if (slot.date !== undefined) {
//         fields.push(`date = $${index++}`);
//         values.push(slot.date);
//       }

//       if (slot.startTime !== undefined) {
//         fields.push(`startTime=$${index++}`);
//         values.push(slot.startTime);
//       }

//       if (slot.endTime !== undefined) {
//         fields.push(`endTime=$${index++}`);
//         values.push(slot.endTime);
//       }

//       if (fields.length === 0) continue;

//       values.push(slot.id);
//       values.push(doctorId);

//       const query = `
//         UPDATE availability
//         SET ${fields.join(", ")}
//         WHERE id = $${index++} AND doctor_id = $${index}
//         RETURNING *;
//       `;

//       const { rows } = await pool.query(query, values);

//       updatedRows.push(rows[0]);
//     }

//     await client.query("COMMIT");
//     return updatedRows;
//   } catch (e) {
//     await client.query("ROLLBACK");
//     throw e;
//   } finally {
//     await client.release();
//   }
// };

exports.updateDoctorAvailability = async (doctorId, availabilityData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const values = [];
    const placeholders = [];

    let index = 1;

    for (const slot of availabilityData) {
      placeholders.push(`($${index++}, $${index++}, $${index++}, $${index++})`);

      values.push(slot.id, slot.date, slot.startTime, slot.endTime);
    }

    values.push(Number(doctorId));

    const query = `
      UPDATE availability AS a
      SET
        date = v.date::date,
        start_time = v.startTime::time,
        end_time = v.endTime::time
      FROM (
        VALUES
          ${placeholders.join(", ")}
      ) AS v(id, date, startTime, endTime)   -- Create temporary table in query level
      WHERE
        a.id = v.id::int
        AND a.doctor_id = $${index}
        AND (
          a.date IS DISTINCT FROM v.date::date
          OR a.start_time IS DISTINCT FROM v.startTime::time
          OR a.end_time IS DISTINCT FROM v.endTime::time
        )
      RETURNING a.*;
    `;

    const { rows } = await client.query(query, values);
    // console.log("Query:", query);
    // console.log("Values:", values);

    await client.query("COMMIT");

    return rows;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
