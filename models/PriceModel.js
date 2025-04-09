import mongoose from "mongoose";

const { Schema } = mongoose;

const PriceSchema = new Schema(
  {
    type1Price: {
      type: Number,
      required: true,
      min: 0,
    },
    type2Price: {
      type: Number,
      required: true,
      min: 0,
    },
    type3Price: {
      type: Number,
      required: true,
      min: 0,
    },
    type4Price: {
      type: Number,
      required: true,
      min: 0,
    },
    vipRegularDiff: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Đảm bảo chỉ có 1 bản ghi active
PriceSchema.pre("save", async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

export default mongoose.model("Price", PriceSchema);
