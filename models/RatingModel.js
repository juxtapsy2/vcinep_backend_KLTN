import mongoose from "mongoose";
const { Schema } = mongoose;

const RatingSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tham chiếu đến User model
      required: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie", // Tham chiếu đến Movie model
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      required: true,
    },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

// Đảm bảo rằng mỗi user chỉ đánh giá một phim duy nhất
RatingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

export default mongoose.model("Rating", RatingSchema);
