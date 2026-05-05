const pool = require("../../config/db");


exports.saveRefreshToken = async (userId, token) => {
  const query = `
     UPDATE users SET refresh_token = $1 WHERE id = $2
  `;
  await pool.query(query, [token, userId]);
};