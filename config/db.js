const { Pool } = require("pg");
const { db } = require("./env");

const pool = new Pool(db);

pool.on("connect", () => console.log("connected to the database"));

pool.on("error", (err) => {
  console.error("Error connecting to the database", err);
  process.exit(1);
});

module.exports = pool;
