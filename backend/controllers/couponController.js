const Coupon = require("../models/CouponDynamo");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Tạo mã giảm giá mới
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
const createCoupon = asyncHandler(async (req, res) => {
  try {
    const { code, ...rest } = req.body;
    if (!code) {
      res.status(400);
      throw new Error("Mã giảm giá là bắt buộc");
    }
    const couponExists = await Coupon.getCouponByCode(code);
    if (couponExists) {
      res.status(400);
      throw new Error("Mã giảm giá đã tồn tại");
    }
    const coupon = await Coupon.createCoupon({ code, ...rest });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400);
    throw error;
  }
});

/**
 * @desc    Lấy tất cả mã giảm giá
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.getAllCoupons();
  res.json(coupons);
});

/**
 * @desc    Lấy thông tin chi tiết của mã giảm giá
 * @route   GET /api/coupons/:id
 * @access  Private/Admin
 */
const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.getCouponById(req.params.id);
  if (coupon) {
    res.json(coupon);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá");
  }
});

/**
 * @desc    Cập nhật mã giảm giá
 * @route   PUT /api/coupons/:id
 * @access  Private/Admin
 */
const updateCoupon = asyncHandler(async (req, res) => {
  const { code, ...rest } = req.body;
  const coupon = await Coupon.getCouponById(req.params.id);
  if (coupon) {
    if (code && code !== coupon.code) {
      const couponExists = await Coupon.getCouponByCode(code);
      if (couponExists) {
        res.status(400);
        throw new Error("Mã giảm giá đã tồn tại");
      }
    }
    const updatedCoupon = await Coupon.updateCoupon(req.params.id, {
      code,
      ...rest,
    });
    res.json(updatedCoupon);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá");
  }
});

/**
 * @desc    Xóa mã giảm giá
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.getCouponById(req.params.id);
  if (coupon) {
    await Coupon.deleteCoupon(req.params.id);
    res.json({ message: "Mã giảm giá đã được xóa" });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá");
  }
});

/**
 * @desc    Validate mã giảm giá
 * @route   POST /api/coupons/validate
 * @access  Private
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code) {
    res.status(400);
    throw new Error("Vui lòng nhập mã giảm giá");
  }
  const coupon = await Coupon.getCouponByCode(code);
  if (!coupon) {
    res.status(404);
    throw new Error("Mã giảm giá không tồn tại");
  }
  if (!Coupon.isValid(coupon)) {
    res.status(400);
    throw new Error("Mã giảm giá đã hết hạn hoặc không còn hiệu lực");
  }
  if (cartTotal < coupon.minimumPurchase) {
    res.status(400);
    throw new Error(
      `Giá trị đơn hàng tối thiểu phải từ ${coupon.minimumPurchase.toLocaleString(
        "vi-VN"
      )}`
    );
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("Mã giảm giá đã hết lượt sử dụng");
  }
  if (coupon.userRestriction && coupon.allowedUsers.length > 0) {
    if (!coupon.allowedUsers.includes(req.user._id)) {
      res.status(403);
      throw new Error("Bạn không được phép sử dụng mã giảm giá này");
    }
  }
  res.json({
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maximumDiscount: coupon.maximumDiscount,
  });
});

/**
 * @desc    Áp dụng mã giảm giá vào đơn hàng
 * @route   POST /api/coupons/apply
 * @access  Private
 */
const applyCoupon = asyncHandler(async (req, res) => {
  const { code, orderId } = req.body;
  const userId = req.user._id;
  const coupon = await Coupon.getCouponByCode(code);
  if (!coupon || !coupon.isActive) {
    res.status(404);
    throw new Error("Mã giảm giá không tồn tại hoặc không hoạt động");
  }
  const now = new Date();
  if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
    res.status(400);
    throw new Error("Mã giảm giá không trong thời gian sử dụng");
  }
  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    res.status(400);
    throw new Error("Mã giảm giá đã đạt giới hạn sử dụng");
  }
  await Coupon.incrementUsageCount(coupon.id);
  res.json({
    success: true,
    message: "Áp dụng mã giảm giá thành công",
    coupon,
  });
});

/**
 * @desc    Lấy danh sách mã giảm giá khả dụng cho người dùng
 * @route   GET /api/coupons/available
 * @access  Private
 */
const getAvailableCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.getAllCoupons();
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
    minimumPurchase: coupon.minimumPurchase,
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
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getAvailableCoupons,
};
