
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/database");

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
}).format(new Date());

function getPreviousDate(dateString, days = 1) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

const previousDate = getPreviousDate(today);
const previousMonthDate = (() => {
  const [year, month] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 2, 15))
    .toISOString()
    .slice(0, 10);
})();

describe("Sweety Blood Glucose Tracker API", () => {
  let token;
  let secondUserToken;
  let readingId;
  let userId;

  const testUser = {
    name: "Sweety Test User",
    email: "sweety.test@example.com",
    password: "SweetyTest@123",
  };

  const secondUser = {
    name: "Second Test User",
    email: "sweety.second@example.com",
    password: "SweetyTest@123",
  };

  beforeAll(async () => {
    // Clean only the dedicated test database.
    await prisma.reading.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.reading.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // HEALTH CHECK
  test("GET /api/health - should return healthy status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("healthy");
  });

  // AUTHENTICATION
  test("POST /api/auth/register - should register a new user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.user.passwordHash).toBeUndefined();

    token = response.body.token;
    userId = response.body.user.id;
  });

  test("POST /api/auth/register - should reject duplicate email", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/auth/register - should reject invalid input", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "A",
        email: "invalid-email",
        password: "123",
      });

    expect(response.status).toBe(400);
  });

  test("POST /api/auth/login - should login successfully", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();

    token = response.body.token;
  });

  test("POST /api/auth/login - should reject incorrect password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword@123",
      });

    expect(response.status).toBe(401);
  });

  test("GET /api/auth/me - should reject unauthenticated requests", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  test("GET /api/auth/me - should return authenticated user", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(userId);
    expect(response.body.user.email).toBe(testUser.email);
  });

  // CREATE READINGS
  test("POST /api/readings - should create a morning reading", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: today,
        timeSlot: "MORNING",
        glucoseValue: 130,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.reading.glucoseValue).toBe(130);

    readingId = response.body.reading.id;
  });

  test("POST /api/readings - should reject duplicate time slot", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: today,
        timeSlot: "MORNING",
        glucoseValue: 120,
      });

    expect(response.status).toBe(409);
  });

  test("POST /api/readings - should reject glucose above 600", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: today,
        timeSlot: "AFTER_BREAKFAST",
        glucoseValue: 700,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("40 and 600");
  });

  test("POST /api/readings - should reject glucose below 40", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: today,
        timeSlot: "AFTER_BREAKFAST",
        glucoseValue: 20,
      });

    expect(response.status).toBe(400);
  });

  test("POST /api/readings - should reject future dates", async () => {
    const futureDate = getPreviousDate(today, -1);

    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: futureDate,
        timeSlot: "AFTER_BREAKFAST",
        glucoseValue: 120,
      });

    expect(response.status).toBe(400);
  });

  test("POST /api/readings - should create remaining three slots", async () => {
    const slots = [
      { timeSlot: "AFTER_BREAKFAST", glucoseValue: 145 },
      { timeSlot: "AFTER_LUNCH", glucoseValue: 160 },
      { timeSlot: "AFTER_DINNER", glucoseValue: 135 },
    ];

    for (const slot of slots) {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          readingDate: today,
          ...slot,
        });

      expect(response.status).toBe(201);
    }
  });

  test("POST /api/readings - should enforce four readings per day", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: today,
        timeSlot: "MORNING",
        glucoseValue: 125,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("4 readings");
  });

  test("POST /api/readings - should reject unauthenticated requests", async () => {
    const response = await request(app)
      .post("/api/readings")
      .send({
        readingDate: today,
        timeSlot: "MORNING",
        glucoseValue: 120,
      });

    expect(response.status).toBe(401);
  });

  // GET READINGS
  test("GET /api/readings - should return user's readings", async () => {
    const response = await request(app)
      .get("/api/readings")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.readings).toHaveLength(4);
  });

  test("GET /api/readings - should filter readings by date", async () => {
    const response = await request(app)
      .get(`/api/readings?date=${today}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.readings).toHaveLength(4);
  });

  test("GET /api/readings/:id - should return one reading", async () => {
    const response = await request(app)
      .get(`/api/readings/${readingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.reading.id).toBe(readingId);
  });

  test("GET /api/readings/:id - should return 404 for unknown reading", async () => {
    const response = await request(app)
      .get("/api/readings/00000000-0000-4000-8000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  // UPDATE READING
  test("PUT /api/readings/:id - should update glucose value", async () => {
    const response = await request(app)
      .put(`/api/readings/${readingId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        glucoseValue: 130,
      });

    expect(response.status).toBe(200);
    expect(response.body.reading.glucoseValue).toBe(130);
  });

  test("PUT /api/readings/:id - should reject invalid glucose value", async () => {
    const response = await request(app)
      .put(`/api/readings/${readingId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        glucoseValue: 700,
      });

    expect(response.status).toBe(400);
  });

  test("PUT /api/readings/:id - should enforce daily limit when changing date", async () => {
    const createResponse = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: previousDate,
        timeSlot: "MORNING",
        glucoseValue: 110,
      });

    expect(createResponse.status).toBe(201);

    const oldReadingId = createResponse.body.reading.id;

    const updateResponse = await request(app)
      .put(`/api/readings/${oldReadingId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: today,
      });

    expect(updateResponse.status).toBe(400);
    expect(updateResponse.body.message).toContain("4 readings");
  });

  // REPORTS
  test("GET daily report - should calculate correct statistics", async () => {
    const response = await request(app)
      .get(`/api/readings/reports/daily?date=${today}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.report.count).toBe(4);
    expect(response.body.report.high).toBe(160);
    expect(response.body.report.low).toBe(130);
    expect(response.body.report.average).toBe(142.5);
  });

  test("GET daily report - should reject future dates", async () => {
    const futureDate = getPreviousDate(today, -1);

    const response = await request(app)
      .get(`/api/readings/reports/daily?date=${futureDate}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  test("GET month-to-date report - should return statistics", async () => {
    const response = await request(app)
      .get("/api/readings/reports/month-to-date")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.report.count).toBe(5);
    expect(response.body.report.high).toBe(160);
    expect(response.body.report.low).toBe(110);
  });

  test("GET previous-month report - should return empty statistics", async () => {
    const response = await request(app)
      .get("/api/readings/reports/previous-month")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.report.count).toBe(0);
    expect(response.body.report.high).toBeNull();
    expect(response.body.report.low).toBeNull();
    expect(response.body.report.average).toBeNull();
  });

  // USER DATA ISOLATION
  test("POST /api/auth/register - should register a second user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(secondUser);

    expect(response.status).toBe(201);
    secondUserToken = response.body.token;
  });

  test("GET /api/readings - should not expose another user's readings", async () => {
    const response = await request(app)
      .get("/api/readings")
      .set("Authorization", `Bearer ${secondUserToken}`);

    expect(response.status).toBe(200);
    expect(response.body.readings).toHaveLength(0);
  });

  test("GET /api/readings/:id - should not expose another user's reading", async () => {
    const response = await request(app)
      .get(`/api/readings/${readingId}`)
      .set("Authorization", `Bearer ${secondUserToken}`);

    expect(response.status).toBe(404);
  });

  // DELETE READING
  test("DELETE /api/readings/:id - should delete a reading", async () => {
    const response = await request(app)
      .delete(`/api/readings/${readingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("DELETE /api/readings/:id - should return 404 after deletion", async () => {
    const response = await request(app)
      .get(`/api/readings/${readingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  // PREVIOUS MONTH DATE SANITY CHECK
  test("Previous month test date should be a valid calendar date", () => {
    expect(previousMonthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
