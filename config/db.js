import mongoose from "mongoose";
/**
 * Kết nối với MongoDB sử dụng Mongoose.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const isDev = process.env.NODE_ENV !== "production";
  const uri = isDev ? "mongodb://localhost:27017/vcinep" : process.env.CONNECT_STRING;
  try {
    await mongoose.connect(uri);
    console.log(`Connected to ${isDev ? "Local DB" : "Production DB"}`);
  } catch (error) {
    console.error("Error connecting database:", error.message);
    process.exit(1);
  }
};

export default connectDB;
