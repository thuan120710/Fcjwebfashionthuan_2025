const mongoose = require('mongoose');

/**
 * Address Model
 * Đại diện cho địa chỉ của người dùng trong hệ thống
 */
const addressSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    fullName: {
      type: String,
      required: true,
    },
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: false,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
    addressType: {
      type: String,
      required: true,
      enum: ['shipping', 'billing', 'both'],
      default: 'both',
    },
  },
  {
    timestamps: true,
  }
);

// Phương thức kiểm tra xem địa chỉ có phải là địa chỉ mặc định không
addressSchema.methods.isDefaultAddress = function() {
  return this.isDefault;
};

// Phương thức kiểm tra xem địa chỉ có thể sử dụng cho giao hàng không
addressSchema.methods.canUseForShipping = function() {
  return this.addressType === 'shipping' || this.addressType === 'both';
};

// Phương thức kiểm tra xem địa chỉ có thể sử dụng cho thanh toán không
addressSchema.methods.canUseForBilling = function() {
  return this.addressType === 'billing' || this.addressType === 'both';
};

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;