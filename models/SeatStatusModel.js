import mongoose from "mongoose";
const { Schema } = mongoose;
const SeatStatusSchema = new Schema({
  showtimeId: {
    type: Schema.Types.ObjectId,
    ref: "Showtime",
    required: true,
  },
  seatId: {
    type: Schema.Types.ObjectId,
    ref: "Seat",
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "reserved", "holding"],
    default: "available",
  },
  IdUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});
export default mongoose.model("SeatStatus", SeatStatusSchema);
