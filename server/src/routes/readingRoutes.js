
const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");

const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
} = require("../controllers/readingController");

const {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
} = require("../controllers/reportController");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Reports must come before /:id
router.get("/reports/daily", getDailyReport);
router.get("/reports/month-to-date", getMonthToDateReport);
router.get("/reports/previous-month", getPreviousMonthReport);

// Reading CRUD
router.post("/", createReading);
router.get("/", getReadings);
router.get("/:id", getReadingById);
router.put("/:id", updateReading);
router.delete("/:id", deleteReading);

module.exports = router;
