import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }

  // Offline-only safety: allow only localhost MongoDB instances.
  const isLocalMongo =
    mongoUri.includes("127.0.0.1") || mongoUri.includes("localhost");
  if (!isLocalMongo) {
    throw new Error(
      "MONGO_URI must point to localhost/127.0.0.1 for offline lab mode."
    );
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected.");
};
