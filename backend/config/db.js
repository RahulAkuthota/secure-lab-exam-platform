import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const allowNonLocalMongo = process.env.ALLOW_NON_LOCAL_MONGO === "true";

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }

  // Offline-only safety by default; Docker can opt-in to non-local hosts.
  const isLocalMongo =
    mongoUri.includes("127.0.0.1") || mongoUri.includes("localhost");
  if (!isLocalMongo && !allowNonLocalMongo) {
    throw new Error(
      "MONGO_URI must point to localhost/127.0.0.1 unless ALLOW_NON_LOCAL_MONGO=true."
    );
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected.");
};
