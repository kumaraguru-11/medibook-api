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
  const { name, specialty, experience, description, role } = userData;

  const query = `
    UPDATE users
    SET 
      name = COALESCE($1, name),
      specialty = COALESCE($2, specialty),
      experience = COALESCE($3, experience),
      description = COALESCE($4, description),
      role = COALESCE($5, role)
    WHERE id = $6
    RETURNING *
  `;

  const values = [name, specialty, experience, description, role, userId];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * exports.updateUser = async (userId, userData) => {
  const fields = [];
  const values = [];
  let index = 1;

  for (const key in userData) {
    fields.push(`${key} = $${index}`);
    values.push(userData[key]);
    index++;
  }

  values.push(userId);

  const query = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};
 */
