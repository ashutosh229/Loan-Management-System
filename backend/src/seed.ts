// Manual CLI seed script: `npm run seed`.
// Always force-reseeds (wipes and recreates all seed accounts), which is
// useful if you want a clean slate. The server itself also auto-seeds an
// EMPTY database on boot (see seedData.ts) so this script is optional for
// a first-time Docker run — it's here for manual resets during dev.
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "./config/db";
import { seedDatabase } from "./seedData";

async function main() {
  await connectDB();
  await seedDatabase(true);
  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
