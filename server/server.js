const express = require("express");
const path = require("path");
const { readDB, writeDB } = require("./lib/store");


const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static files later 
app.use(express.static(path.join(__dirname, "..", "public")));

// Test route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.get("/api/exercises", (req, res) => {
  const db = readDB();

  // Return only id + name for list view
  const list = db.exercises.map(e => ({
    id: e.id,
    name: e.name
  }));

  res.status(200).json(list);
});

app.get("/api/exercises/:id", (req, res) => {
  const db = readDB();

  const exercise = db.exercises.find(
    e => e.id === req.params.id
  );

  if (!exercise) {
    return res.status(400).json({ error: "Unknown exercise id" });
  }

  const logs = db.logs.filter(
    l => l.exerciseId === exercise.id
  );

  res.status(200).json({
    ...exercise,
    logs
  });
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

app.get("/api/logs", (req, res) => {
  const db = readDB();

  const list = db.logs.map(l => ({
    id: l.id,
    date: l.date,
    exerciseId: l.exerciseId
  }));

  res.status(200).json(list);
});

app.get("/api/logs/:id", (req, res) => {
  const db = readDB();

  const log = db.logs.find(
    l => l.id === req.params.id
  );

  if (!log) {
    return res.status(400).json({ error: "Unknown log id" });
  }

  const exercise = db.exercises.find(
    e => e.id === log.exerciseId
  ) || null;

  res.status(200).json({
    ...log,
    exercise
  });
});

app.post("/api/logs", (req, res) => {
  const { exerciseId, date, weightKg, reps } = req.body;

  if (!exerciseId || typeof exerciseId !== "string") {
    return res.status(400).json({ error: "exerciseId is required" });
  }
  if (!date || typeof date !== "string") {
    return res.status(400).json({ error: "date is required" });
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

  const nextNumber = db.logs.length + 1;
  const newLog = {
    id: `l${nextNumber}`,
    exerciseId,
    date,
    weightKg,
    reps
  };

  db.logs.push(newLog);
  writeDB(db);

  res.status(200).json(newLog);
});

app.post("/api/logs/:id", (req, res) => {
  const { date, weightKg, reps } = req.body;

  const db = readDB();
  const log = db.logs.find(l => l.id === req.params.id);

  if (!log) {
    return res.status(400).json({ error: "Unknown log id" });
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

app.post("/api/logs/:id/delete", (req, res) => {
  const db = readDB();

  const index = db.logs.findIndex(
    l => l.id === req.params.id
  );

  if (index === -1) {
    return res.status(400).json({ error: "Unknown log id" });
  }

  const deleted = db.logs.splice(index, 1)[0];
  writeDB(db);

  res.status(200).json(deleted);
});


if (require.main === module) {
  if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;

}

module.exports = app;

