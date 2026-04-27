const fs = require("fs");
const path = require("path");
const pool = require("../../config/db");

async function runMigrations() {
  try {
    const migrationsPath = path.join(__dirname, "..");
    const files = fs.readdirSync(migrationsPath);

    const migrationFiles = files
      .filter((file) => file.endsWith(".sql")) // only SQL files
      .sort(); // ensure order

    for (const file of migrationFiles) {
      if (!file.endsWith(".sql")) continue;

      const sql = fs.readFileSync(path.join(migrationsPath, file)).toString();

      console.log(`Running ${file}...`);
      await pool.query(sql);
    }

    console.log("All migrations executed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigrations();
