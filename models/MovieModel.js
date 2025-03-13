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

// Create slug before saving
MovieSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = slugify(this.title, {
      lower: true, // Convert to lowercase
      strict: true, // Remove special characters
      trim: true, // Trim whitespace from both ends
    });
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
