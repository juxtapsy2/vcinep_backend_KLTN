import mongoose from "mongoose";

const { Schema } = mongoose;

const SeatSchema = new Schema(
  {
    theaterId: {
      type: Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
    type: {
      type: String,
      enum: ["standard", "vip"],
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    row: {
      type: String,
      required: true,
    },
    column: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Đảm bảo mỗi ghế trong một phòng chiếu là duy nhất
SeatSchema.index({ theaterId: 1, row: 1, column: 1 }, { unique: true });
SeatSchema.index({ theaterId: 1, seatNumber: 1 }, { unique: true });

export default mongoose.model("Seat", SeatSchema);
