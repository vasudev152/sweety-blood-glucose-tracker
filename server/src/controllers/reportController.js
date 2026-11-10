
const prisma = require("../config/database");

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isValidDate(value) {
  if (typeof value !== "string") return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day] = match.map(Number);
  const date = parseDate(value);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Current calendar date in India
function getTodayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function getStatistics(userId, startDate, endDate) {
  const result = await prisma.reading.aggregate({
    where: {
      userId,
      readingDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      _all: true,
    },
    _min: {
      glucoseValue: true,
    },
    _max: {
      glucoseValue: true,
    },
    _avg: {
      glucoseValue: true,
    },
  });

  const count = result._count._all;

  return {
    count,
    high: result._max.glucoseValue,
    low: result._min.glucoseValue,
    average:
      count > 0
        ? Math.round(result._avg.glucoseValue * 10) / 10
        : null,
  };
}

// GET /api/readings/reports/daily?date=YYYY-MM-DD
async function getDailyReport(req, res, next) {
  try {
    const dateString = req.query.date || getTodayIST();

    if (!isValidDate(dateString)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date in YYYY-MM-DD format.",
      });
    }

    if (dateString > getTodayIST()) {
      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed.",
      });
    }

    const date = parseDate(dateString);

    const statistics = await getStatistics(
      req.user.id,
      date,
      date
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "daily",
        startDate: dateString,
        endDate: dateString,
        ...statistics,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/readings/reports/month-to-date
async function getMonthToDateReport(req, res, next) {
  try {
    const todayString = getTodayIST();
    const [year, month] = todayString.split("-").map(Number);

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = parseDate(todayString);

    const statistics = await getStatistics(
      req.user.id,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "month-to-date",
        startDate: formatDate(startDate),
        endDate: todayString,
        ...statistics,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/readings/reports/previous-month
async function getPreviousMonthReport(req, res, next) {
  try {
    const todayString = getTodayIST();
    const [year, month] = todayString.split("-").map(Number);

    const startDate = new Date(Date.UTC(year, month - 2, 1));
    const endDate = new Date(Date.UTC(year, month - 1, 0));

    const statistics = await getStatistics(
      req.user.id,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "previous-month",
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        ...statistics,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
};
