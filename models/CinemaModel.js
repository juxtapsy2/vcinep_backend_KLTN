import mongoose from "mongoose";
import slugify from "slugify";

const { Schema } = mongoose;
const CinemaSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mapLocation: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    coverImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Create slug before saving
CinemaSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true, // Convert to lowercase
      strict: true, // Remove special characters
      trim: true, // Trim whitespace from both ends
    });
  }
  next();
});

// Ensure slug is unique
CinemaSchema.pre("save", async function (next) {
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  const cinemasWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (cinemasWithSlug.length > 0) {
    this.slug = `${this.slug}-${cinemasWithSlug.length + 1}`;
  }
  next();
});

export default mongoose.model("Cinema", CinemaSchema);
