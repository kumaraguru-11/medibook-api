const pool = require("../../config/db");

exports.createUser = async (email, password ) => {
  const userName = email.split("@")[0];

  const query = `
     INSERT INTO users (name,email,password)
     VALUES ($1,$2,$3)
     RETURNING id, name, email
  `;

  const values = [userName, email, password];

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

exports.saveRefreshToken = async (userId, token) => {
  const query = `
     UPDATE users SET refresh_token = $1 WHERE id = $2
  `;
  await pool.query(query, [token, userId]);
};

exports.getAllUsers = async () => {
  const query = `SELECT id,email,name,role FROM users`;

  const result = await pool.query(query);
  return result.rows;
};
