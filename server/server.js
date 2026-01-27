const express = require("express");
const path = require("path");
const { readDB, writeDB } = require("./lib/store");

// Create Express app
const app = express();
const PORT = 3000;

// Generate next ID with given prefix
function nextId(items, prefix) {
  let max = 0;
  for (const item of items) {
    if (typeof item.id === "string" && item.id.startsWith(prefix)) {
      const n = Number(item.id.slice(prefix.length));
      if (!Number.isNaN(n) && n > max) max = n;
    }
  }
  return `${prefix}${max + 1}`;
}

// simple YYYY-MM-DD check
function isValidISODate(dateStr) {  
  return typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files later 
app.use(express.static(path.join(__dirname, "..", "public")));

// Test route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Exercises routes
app.get("/api/exercises", (req, res) => {
  const db = readDB();

  // Return only id + name for list view
  const list = db.exercises.map(e => ({
    id: e.id,
    name: e.name
  }));

  res.status(200).json(list);
});
// Get exercise detail with logs
app.get("/api/exercises/:id", (req, res) => {
  const db = readDB();

  const exercise = db.exercises.find(
    e => e.id === req.params.id
  );

  if (!exercise) {
    return res.status(404).json({ error: "Unknown exercise id" });
  }

  const logs = db.logs.filter(
    l => l.exerciseId === exercise.id
  );

  res.status(200).json({
    ...exercise,
    logs
  });
});

// Create new exercise
app.post("/api/exercises", (req, res) => {
  const { name, muscleGroup } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "name is required" });
  }
  if (!muscleGroup || typeof muscleGroup !== "string" || muscleGroup.trim() === "") {
    return res.status(400).json({ error: "muscleGroup is required" });
  }

  const db = readDB();

  const newExercise = {
    id: nextId(db.exercises, "e"),
    name: name.trim(),
    muscleGroup: muscleGroup.trim()
  };


  db.exercises.push(newExercise);
  writeDB(db);

  res.status(201).json(newExercise);
});

// Logs routes
app.get("/api/logs", (req, res) => {
  const db = readDB();

  const list = db.logs.map(l => ({
    id: l.id,
    date: l.date,
    exerciseId: l.exerciseId
  }));

  res.status(200).json(list);
});

// Get log detail with exercise info
app.get("/api/logs/:id", (req, res) => {
  const db = readDB();

  const log = db.logs.find(
    l => l.id === req.params.id
  );

  if (!log) {
    return res.status(404).json({ error: "Unknown log id" });
  }

  const exercise = db.exercises.find(
    e => e.id === log.exerciseId
  ) || null;

  res.status(200).json({
    ...log,
    exercise
  });
});

// Create new log
app.post("/api/logs", (req, res) => {
  const { exerciseId, date, weightKg, reps } = req.body;

  if (!exerciseId || typeof exerciseId !== "string") {
    return res.status(400).json({ error: "exerciseId is required" });
  }
  if  (!isValidISODate(date)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  }
  if (typeof weightKg !== "number" || weightKg <= 0) {
    return res.status(400).json({ error: "weightKg must be a positive number" });
  }
  if (typeof reps !== "number" || reps <= 0) {
    return res.status(400).json({ error: "reps must be a positive number" });
  }

  const db = readDB();

  const exerciseExists = db.exercises.some(
    e => e.id === exerciseId
  );

  if (!exerciseExists) {
    return res.status(400).json({ error: "exerciseId does not exist" });
  }

  const newLog = {
    id: nextId(db.logs, "l"),
    exerciseId,
    date,
    weightKg,
    reps
  };


  db.logs.push(newLog);
  writeDB(db);

  res.status(201).json(newLog);
});

// Update existing log
app.post("/api/logs/:id", (req, res) => {
  const { date, weightKg, reps } = req.body;

  const db = readDB();
  const log = db.logs.find(l => l.id === req.params.id);

  if (!log) {
    return res.status(404).json({ error: "Unknown log id" });
  }

  if (date !== undefined) {
    if (typeof date !== "string" || date.trim() === "") {
      return res.status(400).json({ error: "Invalid date" });
    }
    log.date = date;
  }

  if (weightKg !== undefined) {
    if (typeof weightKg !== "number" || weightKg <= 0) {
      return res.status(400).json({ error: "Invalid weightKg" });
    }
    log.weightKg = weightKg;
  }

  if (reps !== undefined) {
    if (typeof reps !== "number" || reps <= 0) {
      return res.status(400).json({ error: "Invalid reps" });
    }
    log.reps = reps;
  }

  writeDB(db);
  res.status(200).json(log);
});

// Delete existing log
app.post("/api/logs/:id/delete", (req, res) => {
  const db = readDB();

  const index = db.logs.findIndex(
    l => l.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({ error: "Unknown log id" });
  }

  const deleted = db.logs.splice(index, 1)[0];
  writeDB(db);

  res.status(200).json(deleted);
});

app.post("/api/exercises/:id", (req, res) => {
  const { name, muscleGroup } = req.body;

  const db = readDB();
  const exercise = db.exercises.find(e => e.id === req.params.id);

  if (!exercise) {
    return res.status(404).json({ error: "Unknown exercise id" });
  }

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Invalid name" });
    }
    exercise.name = name.trim();
  }

  if (muscleGroup !== undefined) {
    if (typeof muscleGroup !== "string" || muscleGroup.trim() === "") {
      return res.status(400).json({ error: "Invalid muscleGroup" });
    }
    exercise.muscleGroup = muscleGroup.trim();
  }

  writeDB(db);
  res.status(200).json(exercise);
});

app.post("/api/exercises/:id/delete", (req, res) => {
  const db = readDB();

  const exId = req.params.id;
  const exerciseIndex = db.exercises.findIndex(e => e.id === exId);

  if (exerciseIndex === -1) {
    return res.status(404).json({ error: "Unknown exercise id" });
  }

  const hasLogs = db.logs.some(l => l.exerciseId === exId);
  if (hasLogs) {
    return res.status(400).json({ error: "Cannot delete exercise with logs" });
  }

  const deleted = db.exercises.splice(exerciseIndex, 1)[0];
  writeDB(db);
  res.status(200).json(deleted);
});


// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
