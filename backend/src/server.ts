import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { seedDatabase } from "./seedData";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  // Auto-seed only if the DB is empty, so a fresh `docker compose up` is
  // immediately usable without a manual step, but restarts never wipe data.
  await seedDatabase(false);
  app.listen(PORT, () => {
    console.log(`LMS backend running on http://localhost:${PORT}`);
  });
}

start();
