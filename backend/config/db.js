const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsCAFile: path.resolve(__dirname, "../rds-combined-ca-bundle.pem"),
      retryWrites: false,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("DocumentDB Connected Successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  Mongoose disconnected");
});

module.exports = connectDB;
