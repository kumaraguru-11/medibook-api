const pool = require("../../config/db");

exports.getUserById = async (id) => {
  const query = `
    SELECT *
    FROM users
    WHERE id = $1 
    `;
  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.updateUser = async (userId, userData) => {
  const { name, specialty, experience, description } = userData;
  const query = `
    UPDATE users
    SET name = $1, specialty = $2, experience = $3, description = $4
    WHERE id = $5
    RETURNING *
  `;
  const values = [name, specialty, experience, description, userId];
  const result = await pool.query(query, values);
  return result.rows[0];
};
