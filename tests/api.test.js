const fs = require("fs");
const path = require("path");

// Use a separate DB file for tests
const TEST_DB_PATH = path.join(__dirname, "test-db.json");

// Seed data for each test
const SEED_DB = {
  exercises: [{ id: "e1", name: "Bench Press", muscleGroup: "Chest" }],
  logs: []
};

// Must be set BEFORE requiring the server (so store.js picks it up)
process.env.DB_PATH = TEST_DB_PATH;

const request = require("supertest");
const app = require("../server/server");

beforeEach(() => {
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify(SEED_DB, null, 2), "utf-8");
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

describe("API health check", () => {
  test("GET /api/health returns status ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("Exercises API", () => {
  test("GET /api/exercises returns an array", async () => {
    const res = await request(app).get("/api/exercises");

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/exercises/:id returns one exercise with logs array", async () => {
    const created = await request(app)
      .post("/api/exercises")
      .send({ name: "Detail Exercise", muscleGroup: "Back" });

    expect([200, 201]).toContain(created.statusCode);
    const exId = created.body.id;

    await request(app)
      .post("/api/logs")
      .send({ exerciseId: exId, date: "2026-01-20", weightKg: 50, reps: 10 });

    const res = await request(app).get(`/api/exercises/${exId}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("id", exId);
    expect(res.body).toHaveProperty("name", "Detail Exercise");
    expect(res.body).toHaveProperty("muscleGroup", "Back");
    expect(Array.isArray(res.body.logs)).toBe(true);
    expect(res.body.logs.length).toBe(1);
    expect(res.body.logs[0]).toHaveProperty("exerciseId", exId);
  });

  test("GET /api/exercises/:id returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/exercises/nope");

    // If your server still returns 400, this will fail; then we change the server to 404.
    expect(res.statusCode).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /api/exercises creates a new exercise", async () => {
    const res = await request(app)
      .post("/api/exercises")
      .send({ name: "Test Exercise", muscleGroup: "Test Group" });

    
    expect([200, 201]).toContain(res.statusCode);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Test Exercise");
    expect(res.body.muscleGroup).toBe("Test Group");
  });

  test("POST /api/exercises returns 400 for missing name", async () => {
    const res = await request(app)
      .post("/api/exercises")
      .send({ muscleGroup: "Chest" });

    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
  });
});

test("POST /api/exercises/:id updates an exercise", async () => {
  // create
  const created = await request(app)
    .post("/api/exercises")
    .send({ name: "Old Name", muscleGroup: "Old Group" });

  expect(created.statusCode).toBe(201);
  const exId = created.body.id;

  // update
  const updated = await request(app)
    .post(`/api/exercises/${exId}`)
    .send({ name: "New Name", muscleGroup: "New Group" });

  expect(updated.statusCode).toBe(200);
  expect(updated.body.id).toBe(exId);
  expect(updated.body.name).toBe("New Name");
  expect(updated.body.muscleGroup).toBe("New Group");

  // fetch to confirm persistence
  const fetched = await request(app).get(`/api/exercises/${exId}`);
  expect(fetched.statusCode).toBe(200);
  expect(fetched.body.name).toBe("New Name");
  expect(fetched.body.muscleGroup).toBe("New Group");
});

test("POST /api/exercises/:id returns 400 for invalid update", async () => {
  const created = await request(app)
    .post("/api/exercises")
    .send({ name: "Valid", muscleGroup: "Valid" });

  const exId = created.body.id;

  const bad = await request(app)
    .post(`/api/exercises/${exId}`)
    .send({ name: "" }); // invalid

  expect(bad.statusCode).toBe(400);
  expect(bad.body).toHaveProperty("error");
});

test("POST /api/exercises/:id returns 404 for unknown id", async () => {
  const res = await request(app)
    .post("/api/exercises/does-not-exist")
    .send({ name: "X", muscleGroup: "Y" });

  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty("error");
});


describe("Logs API", () => {
  async function createExerciseForLogs() {
    const res = await request(app)
      .post("/api/exercises")
      .send({ name: "Log Test Exercise", muscleGroup: "Test" });

    return res.body.id;
  }

  test("POST /api/logs creates a new log", async () => {
    const exerciseId = await createExerciseForLogs();

    const res = await request(app)
      .post("/api/logs")
      .send({ exerciseId, date: "2026-01-20", weightKg: 60, reps: 8 });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("id");
    expect(res.body.exerciseId).toBe(exerciseId);
    expect(res.body.date).toBe("2026-01-20");
    expect(res.body.weightKg).toBe(60);
    expect(res.body.reps).toBe(8);
  });

  test("GET /api/logs returns an array of logs", async () => {
    const exerciseId = await createExerciseForLogs();

    await request(app)
      .post("/api/logs")
      .send({ exerciseId, date: "2026-01-20", weightKg: 60, reps: 8 });

    const res = await request(app).get("/api/logs");

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("exerciseId", exerciseId);
  });

  test("GET /api/logs/:id returns one log with exercise object", async () => {
    const exerciseId = await createExerciseForLogs();

    const created = await request(app)
      .post("/api/logs")
      .send({ exerciseId, date: "2026-01-20", weightKg: 60, reps: 8 });

    const logId = created.body.id;

    const res = await request(app).get(`/api/logs/${logId}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("id", logId);
    expect(res.body).toHaveProperty("exerciseId", exerciseId);
    expect(res.body).toHaveProperty("exercise");
    expect(res.body.exercise).toHaveProperty("id", exerciseId);
  });

  test("GET /api/logs/:id returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/logs/nope");

    expect(res.statusCode).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /api/logs returns 400 for non-existent exerciseId", async () => {
    const res = await request(app)
      .post("/api/logs")
      .send({ exerciseId: "e999999", date: "2026-01-20", weightKg: 60, reps: 8 });

    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /api/logs returns 400 for missing date", async () => {
    const exerciseId = await createExerciseForLogs();

    const res = await request(app)
      .post("/api/logs")
      .send({ exerciseId, weightKg: 60, reps: 8 });

    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /api/logs/:id updates an existing log", async () => {
    const exerciseId = await createExerciseForLogs();

    const created = await request(app)
      .post("/api/logs")
      .send({ exerciseId, date: "2026-01-20", weightKg: 60, reps: 8 });

    const logId = created.body.id;

    const updated = await request(app)
      .post(`/api/logs/${logId}`)
      .send({ weightKg: 62.5, reps: 6, date: "2026-01-21" });

    expect(updated.statusCode).toBe(200);
    expect(updated.headers["content-type"]).toMatch(/json/);
    expect(updated.body.id).toBe(logId);
    expect(updated.body.weightKg).toBe(62.5);
    expect(updated.body.reps).toBe(6);
    expect(updated.body.date).toBe("2026-01-21");
  });
});

  