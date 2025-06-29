const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Import controllers
const {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getAvailableCoupons
} = require('../controllers/couponController');

// Route: /api/coupons
router.route('/')
  .post(protect, admin, createCoupon) // Chỉ admin mới có thể tạo coupon
  .get(protect, admin, getCoupons); // Lấy tất cả coupon (admin only)

// Route: /api/coupons/available
router.get('/available', protect, getAvailableCoupons); // Lấy danh sách mã giảm giá khả dụng cho người dùng

// Route: /api/coupons/validate
router.route('/validate').post(protect, validateCoupon); // Kiểm tra coupon có hợp lệ không

// Route: /api/coupons/apply
router.route('/apply').post(protect, applyCoupon); // Áp dụng coupon vào đơn hàng

// Route: /api/coupons/:id
router.route('/:id')
  .get(protect, admin, getCouponById) // Lấy thông tin chi tiết của coupon
  .put(protect, admin, updateCoupon) // Cập nhật coupon
  .delete(protect, admin, deleteCoupon); // Xóa coupon

module.exports = router;