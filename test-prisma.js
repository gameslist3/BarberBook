const { PrismaClient } = require('@prisma/client');

try {
  const prisma1 = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL || "file:./dev.db" });
  console.log("PrismaClient initialized with datasourceUrl!");
} catch (error) {
  console.error("Failed with datasourceUrl:", error.message);
}
