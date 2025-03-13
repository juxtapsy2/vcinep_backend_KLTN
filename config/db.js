import mongoose from "mongoose";
/**
 * Kết nối với MongoDB sử dụng Mongoose.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECT_STRING);
    console.log("Kết nối database thành công");
  } catch (error) {
    console.error("Lỗi kết nối database:", error.message);
    process.exit(1);
  }
};

export default connectDB;
