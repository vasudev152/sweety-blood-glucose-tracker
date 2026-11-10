require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("../src/config/database");

async function main() {
  const demoEmail = "demo@sweety.local";
  const demoPassword = "SweetyDemo@2026";

  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      name: "Sweety Demo User",
      passwordHash,
    },
    create: {
      name: "Sweety Demo User",
      email: demoEmail,
      passwordHash,
    },
  });

  const today = new Date();
  const readingDate = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const samples = [
    { timeSlot: "MORNING", glucoseValue: 110 },
    { timeSlot: "AFTER_BREAKFAST", glucoseValue: 135 },
    { timeSlot: "AFTER_LUNCH", glucoseValue: 145 },
    { timeSlot: "AFTER_DINNER", glucoseValue: 125 },
  ];

  for (const sample of samples) {
    await prisma.reading.upsert({
      where: {
        userId_readingDate_timeSlot: {
          userId: user.id,
          readingDate,
          timeSlot: sample.timeSlot,
        },
      },
      update: {
        glucoseValue: sample.glucoseValue,
      },
      create: {
        userId: user.id,
        readingDate,
        timeSlot: sample.timeSlot,
        glucoseValue: sample.glucoseValue,
      },
    });
  }

  console.log("Demo user and sample readings created successfully.");
  console.log(`Demo email: ${demoEmail}`);
  console.log(`Sample readings: ${samples.length}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
