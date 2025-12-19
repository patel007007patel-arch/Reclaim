import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

// Helper to avoid printing full credentials in logs
const maskMongoUri = (uri: string) => {
  try {
    // If it's an SRV / standard Mongo URI, mask user:pass
    const atIndex = uri.indexOf("@");
    const schemeEnd = uri.indexOf("://");
    if (schemeEnd !== -1 && atIndex !== -1 && atIndex > schemeEnd) {
      return uri.slice(0, schemeEnd + 3) + "***:***" + uri.slice(atIndex);
    }
    return uri;
  } catch {
    return uri;
  }
};

if (!MONGODB_URI) {
  console.error(
    "[DB] MONGODB_URI missing. Make sure it is set in your .env or .env.local file."
  );
  throw new Error("MONGODB_URI missing");
} else {
  console.log("[DB] MONGODB_URI loaded from environment");
  console.log("[DB] Using MONGODB_URI:", maskMongoUri(MONGODB_URI));
}

export const connectDB = async () => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    // Already connected (e.g., hot reload / subsequent requests)
    return;
  }

  console.log("[DB] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("[DB] MongoDB connected successfully");
};

