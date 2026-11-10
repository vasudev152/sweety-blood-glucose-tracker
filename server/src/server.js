
require("dotenv").config();

const app = require("./app");
const prisma = require("./config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  try {
    await prisma.$connect();

    console.log("PostgreSQL connected successfully.");

    const server = app.listen(PORT, () => {
      console.log(`Sweety API running at http://localhost:${PORT}`);
    });

    async function shutdown() {
      console.log("Shutting down Sweety API...");

      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Server startup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
