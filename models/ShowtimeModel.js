import mongoose from "mongoose";
import SeatStatus from "./SeatStatusModel.js";

const { Schema } = mongoose;

const ShowtimeSchema = new Schema(
  {
    theaterId: {
      type: Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
    movieId: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    showDate: {
      type: Date,
      required: true,
      get: function (date) {
        if (date instanceof Date && !isNaN(date)) {
          // Ensure the date is a valid Date object
          const utcDate = new Date(date);
          return utcDate.toISOString().split("T")[0];
        }
        return date; // In case of invalid date, return the original value
      },
      set: function (date) {
        if (date instanceof Date && !isNaN(date)) {
          // Ensure the date is a valid Date object
          const [year, month, day] = date
            .toISOString()
            .split("T")[0]
            .split("-");
          return new Date(
            Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
          );
        } else if (typeof date === "string") {
          // Handle string input (e.g., "YYYY-MM-DD")
          const [year, month, day] = date.split("-");
          return new Date(Date.UTC(year, month - 1, day));
        }
        return date; // Return as is if invalid
      },
    },
    showTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format! Use HH:MM.`,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "scheduled",
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["regular", "early", "special"],
      default: "regular",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

ShowtimeSchema.index(
  { theaterId: 1, showDate: 1, showTime: 1 },
  { unique: true }
);

ShowtimeSchema.pre("save", async function (next) {
  const overlappingShowtime = await this.constructor.findOne({
    theaterId: this.theaterId,
    showDate: this.showDate,
    showTime: this.showTime,
  });

  if (
    overlappingShowtime &&
    (!this._id || !overlappingShowtime._id.equals(this._id))
  ) {
    throw new Error(
      "Showtime already exists in the same theater at the same date and time"
    );
  }

  next();
});

ShowtimeSchema.post("save", async function (doc) {
  try {
    const seats = await mongoose
      .model("Seat")
      .find({ theaterId: doc.theaterId });
    const seatStatus = seats.map((seat) => ({
      showtimeId: doc._id,
      seatId: seat._id,
      status: "available",
    }));
    await mongoose.model("SeatStatus").insertMany(seatStatus);
  } catch (error) {
    console.error("Error adding seat statuses:", error);
  }
});

export default mongoose.model("Showtime", ShowtimeSchema);
