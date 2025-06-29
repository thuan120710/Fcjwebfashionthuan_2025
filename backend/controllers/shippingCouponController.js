const ShippingCoupon = require("../models/ShippingCouponDynamo");
const asyncHandler = require("express-async-handler");

// Tạo mã giảm giá phí vận chuyển mới
const createShippingCoupon = asyncHandler(async (req, res) => {
  const { code, ...rest } = req.body;
  if (!code) {
    res.status(400);
    throw new Error("Mã giảm giá phí vận chuyển là bắt buộc");
  }
  const couponExists = await ShippingCoupon.getCouponByCode(code);
  if (couponExists) {
    res.status(400);
    throw new Error("Mã giảm giá phí vận chuyển đã tồn tại");
  }
  const coupon = await ShippingCoupon.createCoupon({ code, ...rest });
  res.status(201).json(coupon);
});

// Lấy tất cả mã giảm giá phí vận chuyển
const getShippingCoupons = asyncHandler(async (req, res) => {
  const coupons = await ShippingCoupon.getAllCoupons();
  res.json(coupons);
});

// Lấy chi tiết mã giảm giá phí vận chuyển
const getShippingCouponById = asyncHandler(async (req, res) => {
  const coupon = await ShippingCoupon.getCouponById(req.params.id);
  if (coupon) {
    res.json(coupon);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá phí vận chuyển");
  }
});

// Cập nhật mã giảm giá phí vận chuyển
const updateShippingCoupon = asyncHandler(async (req, res) => {
  const { code, ...rest } = req.body;
  const coupon = await ShippingCoupon.getCouponById(req.params.id);
  if (coupon) {
    if (code && code !== coupon.code) {
      const couponExists = await ShippingCoupon.getCouponByCode(code);
      if (couponExists) {
        res.status(400);
        throw new Error("Mã giảm giá phí vận chuyển đã tồn tại");
      }
    }
    const updatedCoupon = await ShippingCoupon.updateCoupon(req.params.id, {
      code,
      ...rest,
    });
    res.json(updatedCoupon);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá phí vận chuyển");
  }
});

// Xóa mã giảm giá phí vận chuyển
const deleteShippingCoupon = asyncHandler(async (req, res) => {
  const coupon = await ShippingCoupon.getCouponById(req.params.id);
  if (coupon) {
    await ShippingCoupon.deleteCoupon(req.params.id);
    res.json({ message: "Mã giảm giá phí vận chuyển đã được xóa" });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá phí vận chuyển");
  }
});

// Validate mã giảm giá phí vận chuyển
const validateShippingCoupon = asyncHandler(async (req, res) => {
  const { code, shippingPrice } = req.body;
  if (!code) {
    res.status(400);
    throw new Error("Vui lòng nhập mã giảm giá phí vận chuyển");
  }
  const coupon = await ShippingCoupon.getCouponByCode(code);
  if (!coupon) {
    res.status(404);
    throw new Error("Mã giảm giá phí vận chuyển không tồn tại");
  }
  if (!ShippingCoupon.isValid(coupon)) {
    res.status(400);
    throw new Error(
      "Mã giảm giá phí vận chuyển đã hết hạn hoặc không còn hiệu lực"
    );
  }
  res.json({
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maximumDiscount: coupon.maximumDiscount,
  });
});

// Áp dụng mã giảm giá phí vận chuyển
const applyShippingCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const coupon = await ShippingCoupon.getCouponByCode(code);
  if (!coupon || !coupon.isActive) {
    res.status(404);
    throw new Error(
      "Mã giảm giá phí vận chuyển không tồn tại hoặc không hoạt động"
    );
  }
  const now = new Date();
  if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
    res.status(400);
    throw new Error("Mã giảm giá phí vận chuyển không trong thời gian sử dụng");
  }
  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    res.status(400);
    throw new Error("Mã giảm giá phí vận chuyển đã đạt giới hạn sử dụng");
  }
  await ShippingCoupon.incrementUsageCount(coupon.id);
  res.json({
    success: true,
    message: "Áp dụng mã giảm giá phí vận chuyển thành công",
    coupon,
  });
});

// Lấy danh sách mã giảm giá phí vận chuyển khả dụng
const getAvailableShippingCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await ShippingCoupon.getAllCoupons();
  const available = coupons.filter(
    (coupon) =>
      coupon.isActive &&
      new Date(coupon.startDate) <= now &&
      new Date(coupon.endDate) >= now &&
      (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit)
  );
  const formattedCoupons = available.map((coupon) => ({
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maximumDiscount: coupon.maximumDiscount,
    usageLimit: coupon.usageLimit,
    usageCount: coupon.usageCount || 0,
    endDate: coupon.endDate,
    remainingUses: coupon.usageLimit
      ? coupon.usageLimit - (coupon.usageCount || 0)
      : null,
  }));
  res.json(formattedCoupons);
});

module.exports = {
  createShippingCoupon,
  getShippingCoupons,
  getShippingCouponById,
  updateShippingCoupon,
  deleteShippingCoupon,
  validateShippingCoupon,
  applyShippingCoupon,
  getAvailableShippingCoupons,
};
