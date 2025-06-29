const mongoose = require("mongoose");

/**
 * Coupon Model
 * Đại diện cho mã giảm giá trong hệ thống
 */
const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixed_amount"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minimumPurchase: {
      type: Number,
      required: false,
      default: 0,
    },
    maximumDiscount: {
      type: Number,
      required: false,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
      default: function () {
        // Default to 7 days from now
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    usageLimit: {
      type: Number,
      required: false,
    },
    usageCount: {
      type: Number,
      required: true,
      default: 0,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableBrands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    userRestriction: {
      type: Boolean,
      default: false,
    },
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware pre-save để đảm bảo các trường bắt buộc và định dạng dữ liệu
couponSchema.pre("save", function (next) {
  // Đảm bảo discountValue luôn là số
  if (this.discountValue !== undefined) {
    this.discountValue = parseFloat(this.discountValue);
  }

  // Đảm bảo startDate và endDate luôn là Date
  if (this.startDate && typeof this.startDate === "string") {
    this.startDate = new Date(this.startDate);
  }

  if (this.endDate && typeof this.endDate === "string") {
    this.endDate = new Date(this.endDate);
  }

  next();
});

// Phương thức kiểm tra xem mã giảm giá có còn hiệu lực không
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
};

// Phương thức tính toán số tiền giảm giá
couponSchema.methods.calculateDiscount = function (orderTotal) {
  if (!this.isValid()) return 0;

  if (orderTotal < this.minimumPurchase) return 0;

  let discount = 0;
  if (this.discountType === "percentage") {
    discount = (orderTotal * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }

  if (this.maximumDiscount && discount > this.maximumDiscount) {
    discount = this.maximumDiscount;
  }

  return discount;
};

// Phương thức kiểm tra xem mã giảm giá có áp dụng được cho sản phẩm không
couponSchema.methods.isApplicableToProduct = function (productId) {
  // Nếu không có danh sách sản phẩm áp dụng, mã giảm giá áp dụng cho tất cả sản phẩm
  if (!this.applicableProducts || this.applicableProducts.length === 0) {
    return !this.excludedProducts || !this.excludedProducts.includes(productId);
  }

  return (
    this.applicableProducts.includes(productId) &&
    (!this.excludedProducts || !this.excludedProducts.includes(productId))
  );
};

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
