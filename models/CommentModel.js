import mongoose from "mongoose";
const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    parentComment: {
      type: Schema.Types.ObjectId, // Thay đổi type từ String sang ObjectId
      ref: "Comment", // Thêm ref để reference đến Comment model
      default: null,
    },
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);
export default mongoose.model("Comment", CommentSchema);
