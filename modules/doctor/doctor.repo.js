const pool = require("../../config/db");
const appointmentRepo = require("../appointment/appointment.repo");

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
  return rows[0];
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

exports.updateAvailabilityAndHandleAppointments = async (
  doctorId,
  existingSlots,
  newSlots,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create doctor blocks from old availability slots
    const blocks = existingSlots.map((slot, index) => ({
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      reason: newSlots[index]?.reason?.trim() || "Doctor unavailable",
    }));

    const createdBlocks = [];

    for (const block of blocks) {
      const blockQuery = `
        INSERT INTO doctor_blocks
        (
          doctor_id,
          date,
          start_time,
          end_time,
          reason
        )
        VALUES ($1, $2, $3, $4,$5)
        RETURNING *;
      `;

      const { rows } = await client.query(blockQuery, [
        doctorId,
        block.date,
        block.start_time,
        block.end_time,
        block.reason,
      ]);

      createdBlocks.push(rows[0]);
    }

    // Find affected appointments
    const affectedAppointmentIds = [];

    for (const block of createdBlocks) {
      const appointments = await appointmentRepo.getAffectedAppointments(
        // client,
        doctorId,
        block,
      );

      affectedAppointmentIds.push(
        ...appointments.map((appointment) => appointment.id),
      );
    }

    // Remove duplicate appointment ids
    const uniqueAppointmentIds = [...new Set(affectedAppointmentIds)];

    // Mark appointments for reschedule
    if (uniqueAppointmentIds.length > 0) {
      await appointmentRepo.markAppointmentsForReschedule(
        // client,
        uniqueAppointmentIds,
      );
    }

    // Delete old availability slots
    const slotIds = existingSlots.map((slot) => slot.id);

    await client.query(
      `
      DELETE FROM availability
      WHERE doctor_id = $1
        AND id = ANY($2::int[])
      `,
      [doctorId, slotIds],
    );

    // Insert new availability slots
    const dates = newSlots.map((slot) => slot.date);

    const startTimes = newSlots.map((slot) => slot.startTime);

    const endTimes = newSlots.map((slot) => slot.endTime);

    const insertAvailabilityQuery = `
      INSERT INTO availability
      (
        doctor_id,
        date,
        start_time,
        end_time
      )
      SELECT
        $1,
        unnest($2::date[]),
        unnest($3::time[]),
        unnest($4::time[])
      RETURNING *;
    `;

    const { rows: updatedAvailability } = await client.query(
      insertAvailabilityQuery,
      [doctorId, dates, startTimes, endTimes],
    );

    await client.query("COMMIT");

    return {
      updatedAvailability,
      affectedAppointments: uniqueAppointmentIds.length,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

exports.createDoctorBlocks = async (doctorId, blocks) => {
  if (!blocks.length) return [];

  const values = [];
  const placeholders = [];

  let index = 1;

  for (const block of blocks) {
    placeholders.push(`($${index++}, $${index++}, $${index++}, $${index++})`);

    values.push(doctorId, block.date, block.start_time, block.end_time);
  }

  const query = `
    INSERT INTO doctor_blocks
    (
      doctor_id,
      date,
      start_time,
      end_time,
      reason
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT
    (
      doctor_id,
      date,
      start_time,
      end_time
    )
    DO NOTHING
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);

  return rows;
};

exports.checkDoctorBlocked = async (availability) => {
  const query = `
    SELECT *
    FROM doctor_blocks
    WHERE doctor_id = $1
      AND date = $2
      AND start_time < $4
      AND end_time > $3
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

exports.deleteAvailabilityByIds = async (client, doctorId, slotIds) => {
  const query = `
    DELETE FROM availability
    WHERE doctor_id = $1
      AND id = ANY($2::int[])
    RETURNING *;
  `;

  const { rows } = await client.query(query, [doctorId, slotIds]);

  return rows;
};

// ============================
// repo
// ============================

exports.getAvailiability = async (filters) => {
  let query = `
    SELECT
      a.id,
      a.doctor_id,
      a.date,
      a.start_time,
      a.end_time,
      a.created_at,

      d.specialty,
      d.experience,
      d.description,
      d.verification_status,

      u.name AS doctor_name,
      u.email,

      ap.id AS appointment_id,
      ap.start_time AS appointment_start_time,
      ap.end_time AS appointment_end_time,
      ap.status AS appointment_status

    FROM availability a

    INNER JOIN doctors d
      ON d.id = a.doctor_id

    INNER JOIN users u
      ON u.id = d.user_id

    LEFT JOIN appointments ap
      ON ap.doctor_id = a.doctor_id
      AND ap.appointment_date = a.date
      AND ap.status IN ('SCHEDULED', 'COMPLETED')
      AND ap.start_time < a.end_time
      AND ap.end_time > a.start_time

    WHERE 1 = 1
  `;

  const values = [];

  let index = 1;

  // filter by doctor
  if (filters.doctorId) {
    query += `
      AND a.doctor_id = $${index}
    `;

    values.push(filters.doctorId);

    index++;
  }

  // filter by specialty
  if (filters.specialty) {
    query += `
      AND LOWER(d.specialty) LIKE LOWER($${index})
    `;

    values.push(`%${filters.specialty}%`);

    index++;
  }

  // start date
  if (filters.startDate) {
    query += `
      AND a.date >= $${index}
    `;

    values.push(filters.startDate);

    index++;
  }

  // end date
  if (filters.endDate) {
    query += `
      AND a.date <= $${index}
    `;

    values.push(filters.endDate);

    index++;
  }

  // default current date onwards
  if (!filters.startDate && !filters.endDate) {
    query += `
      AND a.date >= CURRENT_DATE
    `;
  }

  query += `
    ORDER BY
      a.date ASC,
      a.start_time ASC
  `;

  // pagination
  const limit = Number(filters.limit) || 10;

  const page = Number(filters.page) || 1;

  const offset = (page - 1) * limit;

  query += `
    LIMIT $${index}
    OFFSET $${index + 1}
  `;

  values.push(limit, offset);

  const { rows } = await pool.query(query, values);

  // =====================================
  // Convert into frontend friendly slots
  // =====================================

  const groupedData = {};

  for (const row of rows) {
    const key = `${row.doctor_id}_${row.date}`;

    if (!groupedData[key]) {
      groupedData[key] = {
        doctor_id: row.doctor_id,
        doctor_name: row.doctor_name,
        email: row.email,

        specialty: row.specialty,
        experience: row.experience,
        description: row.description,
        verification_status: row.verification_status,

        date: row.date,

        slots: [],
      };
    }

    // generate 30 min slots
    let currentTime = row.start_time;

    while (currentTime < row.end_time) {
      const start = currentTime;

      const startDate = new Date(
        `1970-01-01T${start}`,
      );

      const endDate = new Date(
        startDate.getTime() + 30 * 60000,
      );

      const end = endDate.toTimeString().slice(0, 5);

      // check booked
      let isBooked = false;

      if (
        row.appointment_start_time &&
        row.appointment_end_time
      ) {
        isBooked =
          start >= row.appointment_start_time &&
          end <= row.appointment_end_time;
      }

      groupedData[key].slots.push({
        start_time: start.slice(0, 5),
        end_time: end,
        is_booked: isBooked,
      });

      currentTime = end;
    }
  }

  return {
    total: rows.length,
    page,
    limit,
    data: Object.values(groupedData),
  };
};
