const app = require("./app");
const { port } = require("./config/env");
const pool = require("./config/db");

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    await pool.query("SELECT 1"); // health check
  } catch (err) {
    console.error("Failed to connect DB:", err);
    process.exit(1);
  }
}

startServer();
