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

  // Return only id + name for list view (as spec suggests)
  const list = db.exercises.map(e => ({
    id: e.id,
    name: e.name
  }));

  res.status(200).json(list);
});


app.post("/api/exercises", (req, res) => {
  const { name, muscleGroup } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "name is required" });
  }
  if (!muscleGroup || typeof muscleGroup !== "string" || muscleGroup.trim() === "") {
    return res.status(400).json({ error: "muscleGroup is required" });
  }

  const db = readDB();

  const nextNumber = db.exercises.length + 1;
  const newExercise = {
    id: `e${nextNumber}`,
    name: name.trim(),
    muscleGroup: muscleGroup.trim()
  };

  db.exercises.push(newExercise);
  writeDB(db);

  res.status(200).json(newExercise);
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
