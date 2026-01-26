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
