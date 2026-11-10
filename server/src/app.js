const readingRoutes = require("./routes/readingRoutes");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
}));

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Sweety Blood Glucose Tracker API",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "Sweety Backend",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

module.exports = app;
