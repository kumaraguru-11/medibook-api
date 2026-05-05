const pool = require("../../config/db");

exports.createUser = async (name, email, password, role = "UNASSIGNED") => {
  const query = `
     INSERT INTO users (name,email,password,role)
     VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role
  `;

  const values = [name, email, password, role];

  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.getUserByEmail = async (email) => {
  const query = `
    SELECT id,name,email,password,role,refresh_token
    FROM users
    WHERE email = $1 
    `;

  const result = await pool.query(query, [email]);
  return result.rows[0];
};

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
  const { name, role } = userData;

  const query = `
    UPDATE users
    SET 
      name = COALESCE($1, name),
      role = COALESCE($2, role)
    WHERE id = $3
    RETURNING *
  `;

  const values = [name, role, userId];

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
