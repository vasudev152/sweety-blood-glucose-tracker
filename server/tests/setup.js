require("dotenv").config({ path: ".env.test" });

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  "test_only_secret_key_for_sweety_automated_testing_2026";