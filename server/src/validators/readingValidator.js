
const { z } = require("zod");

const timeSlots = [
  "MORNING",
  "AFTER_BREAKFAST",
  "AFTER_LUNCH",
  "AFTER_DINNER",
];

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Please enter a valid date.")
  .refine((value) => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    return value <= today;
  }, "Date cannot be in the future.");

const readingSchema = z.object({
  readingDate: dateSchema,

  timeSlot: z.enum(timeSlots, {
    error: "Please select a valid time slot.",
  }),

  glucoseValue: z
    .number({
      error: "Please enter a glucose value.",
    })
    .int("Glucose value must be a whole number.")
    .min(40, "Value must be between 40 and 600 mg/dl.")
    .max(600, "Value must be between 40 and 600 mg/dl."),
});

const updateReadingSchema = z.object({
  readingDate: dateSchema.optional(),
  timeSlot: z.enum(timeSlots, {
    error: "Please select a valid time slot.",
  }).optional(),
  glucoseValue: z
    .number({
      error: "Please enter a glucose value.",
    })
    .int("Glucose value must be a whole number.")
    .min(40, "Value must be between 40 and 600 mg/dl.")
    .max(600, "Value must be between 40 and 600 mg/dl.")
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "Please provide at least one field to update."
);

module.exports = {
  readingSchema,
  updateReadingSchema,
};
