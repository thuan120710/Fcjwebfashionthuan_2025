const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Phương thức kiểm tra xem đánh giá có hợp lệ không
reviewSchema.methods.isValidRating = function () {
  return this.rating >= 1 && this.rating <= 5;
};

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
