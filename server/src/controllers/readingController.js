const prisma = require("../config/database");

const {
  readingSchema,
  updateReadingSchema,
} = require("../validators/readingValidator");

const slotLabels = {
  MORNING: "Morning (fasting)",
  AFTER_BREAKFAST: "After breakfast",
  AFTER_LUNCH: "After lunch",
  AFTER_DINNER: "After dinner",
};

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function serializeReading(reading) {
  return {
    ...reading,
    readingDate: reading.readingDate.toISOString().slice(0, 10),
    slotLabel: slotLabels[reading.timeSlot],
  };
}

// CREATE READING
async function createReading(req, res, next) {
  try {
    const validation = readingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0].message,
        errors: validation.error.issues,
      });
    }

    const { readingDate, timeSlot, glucoseValue } = validation.data;
    const date = parseDate(readingDate);

    const count = await prisma.reading.count({
      where: {
        userId: req.user.id,
        readingDate: date,
      },
    });

    if (count >= 4) {
      return res.status(400).json({
        success: false,
        message: "You can add only 4 readings per day.",
      });
    }

    const existing = await prisma.reading.findFirst({
      where: {
        userId: req.user.id,
        readingDate: date,
        timeSlot,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You already have ${slotLabels[timeSlot]} reading for this date.`,
      });
    }

    const reading = await prisma.reading.create({
      data: {
        userId: req.user.id,
        readingDate: date,
        timeSlot,
        glucoseValue,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Glucose reading added successfully.",
      reading: serializeReading(reading),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this time slot and date.",
      });
    }

    next(error);
  }
}

// GET ALL READINGS
async function getReadings(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100.",
      });
    }

    const where = {
      userId: req.user.id,
    };

    if (req.query.date) {
      const dateCheck = zodDateCheck(req.query.date);

      if (!dateCheck) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid date.",
        });
      }

      where.readingDate = parseDate(req.query.date);
    }

    const [readings, total] = await Promise.all([
      prisma.reading.findMany({
        where,
        orderBy: [
          { readingDate: "desc" },
          { timeSlot: "asc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reading.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      readings: readings.map(serializeReading),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// DATE VALIDATION
function zodDateCheck(value) {
  if (typeof value !== "string") return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

// GET ONE READING
async function getReadingById(req, res, next) {
  try {
    const reading = await prisma.reading.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: "Reading not found.",
      });
    }

    return res.status(200).json({
      success: true,
      reading: serializeReading(reading),
    });
  } catch (error) {
    next(error);
  }
}

// UPDATE READING
async function updateReading(req, res, next) {
  try {
    const validation = updateReadingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0].message,
        errors: validation.error.issues,
      });
    }

    const existing = await prisma.reading.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Reading not found.",
      });
    }

    const data = validation.data;

    const newDate = data.readingDate
      ? parseDate(data.readingDate)
      : existing.readingDate;

    const newSlot = data.timeSlot || existing.timeSlot;

    // Check whether the reading date is changing.
    const isChangingDate =
      newDate.getTime() !== existing.readingDate.getTime();

    // Enforce the four-readings-per-day limit on the new date.
    if (isChangingDate) {
      const countOnNewDate = await prisma.reading.count({
        where: {
          userId: req.user.id,
          readingDate: newDate,
        },
      });

      if (countOnNewDate >= 4) {
        return res.status(400).json({
          success: false,
          message: "You can have only 4 readings per day.",
        });
      }
    }

    // Check for duplicate time slots.
    const duplicate = await prisma.reading.findFirst({
      where: {
        userId: req.user.id,
        readingDate: newDate,
        timeSlot: newSlot,
        NOT: {
          id: existing.id,
        },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `You already have ${slotLabels[newSlot]} reading for this date.`,
      });
    }

    // Update the reading.
    const reading = await prisma.reading.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(data.readingDate && {
          readingDate: newDate,
        }),
        ...(data.timeSlot && {
          timeSlot: newSlot,
        }),
        ...(data.glucoseValue !== undefined && {
          glucoseValue: data.glucoseValue,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Glucose reading updated successfully.",
      reading: serializeReading(reading),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this time slot and date.",
      });
    }

    next(error);
  }
}

// DELETE READING
async function deleteReading(req, res, next) {
  try {
    const existing = await prisma.reading.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Reading not found.",
      });
    }

    await prisma.reading.delete({
      where: {
        id: existing.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Glucose reading deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
};