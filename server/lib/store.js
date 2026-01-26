const fs = require("fs");
const path = require("path");

// Allow overriding DB path via env for testing
const DEFAULT_DB_PATH = path.join(__dirname, "..", "data", "db.json");
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;


function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

module.exports = { readDB, writeDB };
