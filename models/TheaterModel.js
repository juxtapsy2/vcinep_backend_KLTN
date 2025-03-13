import mongoose from "mongoose";

const { Schema } = mongoose;

const TheaterSchema = new Schema(
  {
    cinemaId: {
      type: Schema.Types.ObjectId,
      ref: "Cinema",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["2D", "3D", "4DX", "VIP"],
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "under maintenance"],
      default: "active",
    },
    capacity: {
      type: Number,
      // required: true,
      min: 1,
    },
    screenSize: {
      type: String,
    },
    soundSystem: {
      type: String,
    },
    rows: {
      type: Number,
      required: true,
      min: 1,
    },
    columns: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

// Đảm bảo tên phòng là duy nhất trong một rạp
TheaterSchema.index({ cinemaId: 1, name: 1 }, { unique: true });

export default mongoose.model("Theater", TheaterSchema);
