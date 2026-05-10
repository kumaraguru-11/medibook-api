const pool = require("../../config/db");

exports.createPatientProfile = async (patientData) => {
  const query = `
        INSERT INTO patient_details
        (appointment_id, name, age, gender)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
 `;

  const values = [
    patientData.appointment_id,
    patientData.name,
    patientData.age,
    patientData.gender,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

exports.getPatientProfileByAppointmentId = async (appointmentId) => {
  const query = `SELECT * FROM patient_details WHERE appointment_id = $1`;
  const values = [appointmentId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.updatePatientProfile = async (patientData) => {
  const allowedFields = ["name", "age", "gender"];

  const fields = [];
  const values = [];
  let index = 1;

  for (const key of allowedFields) {
    if (patientData[key] !== undefined) {
      fields.push(`${key}=$${index++}`);
      values.push(patientData[key]);
    }
  }

  values.push(patientData.appointment_id);

   const query = `
    UPDATE patient_details
    SET ${fields.join(", ")}
    WHERE appointment_id = $${index}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
};
