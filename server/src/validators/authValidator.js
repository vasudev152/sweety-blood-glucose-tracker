
const { z } = require("zod");

// Registration validation
const registerSchema = z.object({
  name: z
    .string({
      error: "Name is required.",
    })
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),

  email: z
    .string({
      error: "Email is required.",
    })
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address.")
    .max(255, "Email cannot exceed 255 characters.")
    .transform((value) => value.toLowerCase()),

  password: z
    .string({
      error: "Password is required.",
    })
    .min(8, "Password must contain at least 8 characters.")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password cannot exceed 72 bytes."
    ),
});

// Login validation
const loginSchema = z.object({
  email: z
    .string({
      error: "Email is required.",
    })
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address.")
    .max(255, "Email cannot exceed 255 characters.")
    .transform((value) => value.toLowerCase()),

  password: z
    .string({
      error: "Password is required.",
    })
    .min(1, "Password is required.")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Invalid password."
    ),
});

module.exports = {
  registerSchema,
  loginSchema,
};
