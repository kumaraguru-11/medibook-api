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

//check previous availiability(for update availiability)
exports.checkSlotsByIds = async (doctorId, slotIds) => {
  const query = `
  SELECT * FROM availability
  WHERE doctor_id = $1 AND id = ANY($2::int[])
  `;

  const { rows } = await pool.query(query, [doctorId, slotIds]);
  return rows;
};

//check availiability using date and time (for appointment booking)
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

// exports.updateDoctorAvailability = async (doctorId, availabilityData) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const values = [];
//     const placeholders = [];

//     let index = 1;

//     for (const slot of availabilityData) {
//       placeholders.push(`($${index++}, $${index++}, $${index++}, $${index++})`);

//       values.push(slot.id, slot.date, slot.startTime, slot.endTime);
//     }

//     values.push(Number(doctorId));

//     const query = `
//       UPDATE availability AS a
//       SET
//         date = v.date::date,
//         start_time = v.startTime::time,
//         end_time = v.endTime::time
//       FROM (
//         VALUES
//           ${placeholders.join(", ")}
//       ) AS v(id, date, startTime, endTime)   -- Create temporary table in query level
//       WHERE
//         a.id = v.id::int
//         AND a.doctor_id = $${index}
//         AND (
//           a.date IS DISTINCT FROM v.date::date
//           OR a.start_time IS DISTINCT FROM v.startTime::time
//           OR a.end_time IS DISTINCT FROM v.endTime::time
//         )
//       RETURNING a.*;
//     `;

//     const { rows } = await client.query(query, values);
//     // console.log("Query:", query);
//     // console.log("Values:", values);

//     await client.query("COMMIT");

//     return rows;
//   } catch (e) {
//     await client.query("ROLLBACK");
//     throw e;
//   } finally {
//     client.release();
//   }
// };

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

// exports.getAvailability = async (filters) => {
//   let query = `
//     SELECT
//       a.id,
//       a.doctor_id,
//       a.date,
//       a.start_time,
//       a.end_time,

//       d.specialty,

//       u.name AS doctor_name,

//       COALESCE(
//         json_agg(
//           json_build_object(
//             'id', ap.id,
//             'user_id', ap.user_id,
//             'start_time', ap.start_time,
//             'end_time', ap.end_time,
//             'status', ap.status
//           )
//         ) FILTER (WHERE ap.id IS NOT NULL),
//         '[]'
//       ) AS appointments

//     FROM availability a

//     INNER JOIN doctors d
//       ON d.id = a.doctor_id

//     INNER JOIN users u
//       ON u.id = d.user_id

//     LEFT JOIN appointments ap
//       ON ap.doctor_id = a.doctor_id
//       AND ap.appointment_date = a.date
//       AND ap.status IN ('SCHEDULED', 'COMPLETED')
//       AND ap.start_time >= a.start_time
//       AND ap.end_time <= a.end_time

//     WHERE 1 = 1
//   `;

//   const values = [];
//   let index = 1;

//   // doctor specific screen
//   if (filters.doctorId) {
//     query += ` AND a.doctor_id = $${index}`;
//     values.push(filters.doctorId);
//     index++;
//   } else {
//     // user screen
//     query += ` AND a.date >= CURRENT_DATE`;
//   }

//   // specialty filter
//   if (filters.specialty) {
//     query += ` AND d.specialty ILIKE $${index}`;
//     values.push(`%${filters.specialty}%`);
//     index++;
//   }

//   // start date
//   if (filters.startDate) {
//     query += ` AND a.date >= $${index}`;
//     values.push(filters.startDate);
//     index++;
//   }

//   // end date
//   if (filters.endDate) {
//     query += ` AND a.date <= $${index}`;
//     values.push(filters.endDate);
//     index++;
//   }

//   // hide past data
//   if (filters.hidePast) {
//     query += ` AND a.date >= CURRENT_DATE`;
//   }

//   query += `
//     GROUP BY
//       a.id,
//       d.id,
//       u.id

//     ORDER BY
//       a.date ASC,
//       a.start_time ASC
//   `;

//   // pagination
//   const page = Number(filters.page || 1);
//   const limit = Number(filters.limit || 10);

//   const offset = (page - 1) * limit;

//   query += ` LIMIT $${index} OFFSET $${index + 1}`;

//   values.push(limit, offset);

//   const { rows } = await pool.query(query, values);

//   return rows;
// };

exports.getAvailability = async (filters) => {
  let whereClause = `
    WHERE 1 = 1
  `;

  const values = [];
  let index = 1;

  // doctor specific screen
  if (filters.doctorId) {
    whereClause += ` AND a.doctor_id = $${index}`;
    values.push(filters.doctorId);
    index++;
  } else {
    whereClause += ` AND a.date >= CURRENT_DATE`;
  }

  // specialty filter
  if (filters.specialty) {
    whereClause += ` AND d.specialty ILIKE $${index}`;
    values.push(`%${filters.specialty}%`);
    index++;
  }

  // start date
  if (filters.startDate) {
    whereClause += ` AND a.date >= $${index}`;
    values.push(filters.startDate);
    index++;
  }

  // end date
  if (filters.endDate) {
    whereClause += ` AND a.date <= $${index}`;
    values.push(filters.endDate);
    index++;
  }

  // based on availability id
  if (filters.availabilityId) {
    whereClause += ` AND a.id <= $${index}`;
    values.push(filters.availabilityId);
    index++;
  }

  // hide past data
  if (filters.hidePast) {
    whereClause += ` AND a.date >= CURRENT_DATE`;
  }

  // ----------------------------------
  // COUNT QUERY
  // ----------------------------------

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM availability a
    INNER JOIN doctors d
      ON d.id = a.doctor_id
    INNER JOIN users u
      ON u.id = d.user_id
    ${whereClause}
  `;

  const countResult = await pool.query(countQuery, values);
  const total = Number(countResult.rows[0].total);

  // ----------------------------------
  // MAIN QUERY
  // ----------------------------------

  let query = `
    SELECT
      a.id,
      a.doctor_id,
      a.date,
      a.start_time,
      a.end_time,

      d.specialty,

      u.name AS doctor_name,

      COALESCE(
        json_agg(
          json_build_object(
            'id', ap.id,
            'user_id', ap.user_id,
            'start_time', ap.start_time,
            'end_time', ap.end_time,
            'status', ap.status
          )
        ) FILTER (WHERE ap.id IS NOT NULL),
        '[]'
      ) AS appointments

    FROM availability a

    INNER JOIN doctors d
      ON d.id = a.doctor_id

    INNER JOIN users u
      ON u.id = d.user_id

    LEFT JOIN appointments ap
      ON ap.doctor_id = a.doctor_id
      AND ap.appointment_date = a.date
      AND ap.status IN ('SCHEDULED', 'COMPLETED')
      AND ap.start_time >= a.start_time
      AND ap.end_time <= a.end_time

    ${whereClause}

    GROUP BY
      a.id,
      d.id,
      u.id

    ORDER BY
      a.date ASC,
      a.start_time ASC
  `;

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;

  const queryValues = [...values];

  query += ` LIMIT $${index} OFFSET $${index + 1}`;

  queryValues.push(limit, offset);

  const { rows } = await pool.query(query, queryValues);

  return {
    rows,
    total,
    page,
    limit,
  };
};

exports.deleteAvailabilityAndHandleAppointments = async (
  doctorId,
  existingSlots,
  reason = "Doctor unavailable",
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create doctor blocks
    const blockValues = [];
    const blockPlaceholders = [];

    let index = 1;

    for (const slot of existingSlots) {
      blockPlaceholders.push(
        `($${index++}, $${index++}, $${index++}, $${index++}, $${index++})`,
      );

      blockValues.push(
        doctorId,
        slot.date,
        slot.start_time,
        slot.end_time,
        reason,
      );
    }

    const blockQuery = `
      INSERT INTO doctor_blocks
      (
        doctor_id,
        date,
        start_time,
        end_time,
        reason
      )
      VALUES ${blockPlaceholders.join(", ")}
      RETURNING *;
    `;

    const { rows: createdBlocks } = await client.query(blockQuery, blockValues);

    // Find affected appointments
    const affectedAppointmentIds = [];

    for (const block of createdBlocks) {
      const appointmentQuery = `
        SELECT id
        FROM appointments
        WHERE doctor_id = $1
          AND appointment_date = $2
          AND status = 'SCHEDULED'
          AND start_time < $4
          AND end_time > $3
      `;

      const { rows } = await client.query(appointmentQuery, [
        doctorId,
        block.date,
        block.start_time,
        block.end_time,
      ]);

      affectedAppointmentIds.push(...rows.map((appointment) => appointment.id));
    }

    // Remove duplicates
    const uniqueAppointmentIds = [...new Set(affectedAppointmentIds)];

    // Mark appointments
    if (uniqueAppointmentIds.length > 0) {
      await client.query(
        `
        UPDATE appointments
        SET
          status = 'RESCHEDULE_REQUIRED',
          priority = true
        WHERE id = ANY($1::int[])
        `,
        [uniqueAppointmentIds],
      );
    }

    // Delete availability
    const slotIds = existingSlots.map((slot) => slot.id);

    const deleteQuery = `
      DELETE FROM availability
      WHERE doctor_id = $1
        AND id = ANY($2::int[])
      RETURNING *;
    `;

    const { rows: deletedAvailability } = await client.query(deleteQuery, [
      doctorId,
      slotIds,
    ]);

    await client.query("COMMIT");

    return {
      deletedAvailability,
      affectedAppointments: uniqueAppointmentIds.length,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

exports.getAllDoctors = async (query) => {
  const {
    search = "",
    specialty,
    minExperience,
    maxExperience,
    sortBy = "created_at",
    sortOrder = "DESC",
    page = 1,
    limit = 10,
  } = query;

  const offset = (page - 1) * limit;

  const values = [];
  let whereClause = `
    --WHERE d.verification_status = 'VERIFIED'
    WHERE 1 = 1
  `;

  if (search) {
    values.push(`%${search}%`);

    whereClause += `
      AND u.name ILIKE $${values.length}
    `;
  }

  if (specialty) {
    values.push(specialty);

    whereClause += `
      AND d.specialty = $${values.length}
    `;
  }

  if (minExperience) {
    values.push(minExperience);

    whereClause += `
      AND d.experience >= $${values.length}
    `;
  }

  if (maxExperience) {
    values.push(maxExperience);

    whereClause += `
      AND d.experience <= $${values.length}
    `;
  }
  const totalQuery = `
    SELECT COUNT(*) AS total
    FROM doctors d
    LEFT JOIN users u
      ON d.user_id = u.id
    ${whereClause}
  `;
  const totalResult = await pool.query(totalQuery, values);
  const total = Number(totalResult.rows[0].total);
  values.push(limit);
  values.push(offset);

  const doctorsQuery = `
    SELECT
      d.id,
      d.specialty,
      d.experience,
      d.description,
      d.created_at,

      u.name,

      EXISTS (
        SELECT 1
        FROM availability da
        WHERE da.doctor_id = d.id
          AND da.date = CURRENT_DATE
      ) AS is_available_today

    FROM doctors d

    LEFT JOIN users u
      ON d.user_id = u.id

    ${whereClause}

    ORDER BY d.${sortBy} ${sortOrder}

    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const doctorsResult = await pool.query(doctorsQuery, values);

  return {
    doctors: doctorsResult.rows,

    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getDoctorSpecialties = async () => {
  const query = `
    SELECT DISTINCT specialty
    FROM doctors
    WHERE verification_status = 'VERIFIED'
      AND specialty IS NOT NULL
    ORDER BY specialty ASC
  `;

  const result = await pool.query(query);

  return result.rows;
};
