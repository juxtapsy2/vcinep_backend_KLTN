import mongoose from "mongoose";
import slugify from "slugify";

const { Schema } = mongoose;

const MovieSchema = new Schema(
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
    description: {
      type: String,
      required: true,
    },
    genre: {
      type: [String],
      required: true,
    },
    classification: {
      type: String,
      enum: ["P", "T18", "T16", "T12", "T13", "K", "C"],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
    director: {
      type: String,
      required: true,
    },
    actors: {
      type: [String],
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    trailer: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Tạo slug trước khi lưu (thêm số ngẫu nhiên 4 chữ số để đảm bảo không trùng lặp)
MovieSchema.pre("save", async function (next) {
  if (!this.slug || this.isModified("title")) {
    const baseSlug = slugify(this.title, {
      lower: true, // chuyển thành chữ thường
      strict: true, // loại bỏ ký tự đặc biệt
      trim: true, // cắt khoảng trắng ở đầu và cuối
    });

    let newSlug;
    let slugExists = true;

    // Sinh số ngẫu nhiên và kiểm tra xem slug đã tồn tại hay chưa
    while (slugExists) {
      const randomNum = Math.floor(1000 + Math.random() * 9000); // số ngẫu nhiên 4 chữ số
      newSlug = `${baseSlug}-${randomNum}`;
      slugExists = await this.constructor.findOne({ slug: newSlug });
    }

    this.slug = newSlug;
  }
  next();
});
// Ensure slug is unique
MovieSchema.pre("save", async function (next) {
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  const moviesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (moviesWithSlug.length > 0) {
    this.slug = `${this.slug}-${moviesWithSlug.length + 1}`;
  }
  next();
});

export default mongoose.model("Movie", MovieSchema);
