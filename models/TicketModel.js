import mongoose from "mongoose";

const { Schema } = mongoose;

const TicketSchema = new Schema(
  {
    showtimeId: {
      type: Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },
    seats: {
      type: String,
    },
    concession: {
      type: String,
    },
    date_checkin: {
      type: Date,
      default: null,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    checkinStatus: {
      type: String,
      enum: ["checked_in", "not_checked_in"],
      default: "not_checked_in",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: {
      type: String,
      unique: true,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

TicketSchema.index({ userId: 1, showtimeId: 1 }, { unique: true });

export default mongoose.model("Ticket", TicketSchema);
