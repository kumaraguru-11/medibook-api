const { Pool, types } = require("pg");
const { db } = require("./env");

// Prevent DATE from converting to JS Date object
types.setTypeParser(1082, (value) => value);

const pool = new Pool(db);

pool.on("connect", () => console.log("connected to the database"));

pool.on("error", (err) => {
  console.error("Error connecting to the database", err);
  process.exit(1);
});

module.exports = pool;
