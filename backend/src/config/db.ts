import mongoose from "mongoose";

export const connectDB = async (retries = 10, delayMs = 3000): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      // In Docker, the backend container can start slightly before Mongo is
      // ready to accept connections even with a healthcheck, so retry a
      // few times with a short delay instead of crashing immediately.
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, (err as Error).message);
      if (attempt === retries) {
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
};
