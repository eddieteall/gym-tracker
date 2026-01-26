const request = require("supertest");
const app = require("../server/server");


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

  test("POST /api/exercises creates a new exercise", async () => {
    const res = await request(app)
      .post("/api/exercises")
      .send({ name: "Test Exercise", muscleGroup: "Test Group" });

    expect(res.statusCode).toBe(200);
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

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("id");
    expect(res.body.exerciseId).toBe(exerciseId);
    expect(res.body.date).toBe("2026-01-20");
    expect(res.body.weightKg).toBe(60);
    expect(res.body.reps).toBe(8);
  });

  test("POST /api/logs returns 400 for non-existent exerciseId", async () => {
    const res = await request(app)
      .post("/api/logs")
      .send({ exerciseId: "e999999", date: "2026-01-20", weightKg: 60, reps: 8 });

    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /api/logs/:id updates an existing log", async () => {
    const exerciseId = await createExerciseForLogs();

    // create log first
    const created = await request(app)
      .post("/api/logs")
      .send({ exerciseId, date: "2026-01-20", weightKg: 60, reps: 8 });

    const logId = created.body.id;

    // update it
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
