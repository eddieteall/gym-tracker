const express = require("express");
const path = require("path");
const { readDB, writeDB } = require("./lib/store");


const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static files later (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, "..", "public")));

// Test route (health check)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/exercises", (req, res) => {
  const db = readDB();

  // Return only id + name for list view
  const exercises = db.exercises.map(e => ({
    id: e.id,
    name: e.name
  }));

  res.status(200).json(exercises);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
