import mongoose from "mongoose";
import slugify from "slugify";

const { Schema } = mongoose;

const BlogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Tạo slug trước khi lưu
BlogSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = slugify(this.title, {
      lower: true, // Chuyển thành chữ thường
      strict: true, // Loại bỏ ký tự đặc biệt
      trim: true, // Loại bỏ khoảng trắng ở đầu và cuối
    });
  }
  next();
});

BlogSchema.pre("save", async function (next) {
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  const blogsWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (blogsWithSlug.length > 0) {
    this.slug = `${this.slug}-${blogsWithSlug.length + 1}`;
  }
  next();
});
export default mongoose.model("Blog", BlogSchema);
