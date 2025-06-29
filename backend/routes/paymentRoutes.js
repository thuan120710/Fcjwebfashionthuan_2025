const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Import controllers
const {
  createPayment,
  getPaymentById,
  getMyPayments,
  getAllPayments,
  updatePaymentStatus,
  createVnpayPayment,
  handleVnpayReturn,
} = require('../controllers/paymentController');

// Route: /api/payments
router.route('/')
  .post(protect, createPayment) // Tạo thanh toán mới
  .get(protect, admin, getAllPayments); // Lấy tất cả thanh toán (admin only)

// Route: /api/payments/my
router.route('/my').get(protect, getMyPayments); // Lấy thanh toán của người dùng hiện tại

// Route: /api/payments/:id
router.route('/:id')
  .get(protect, getPaymentById) // Lấy thông tin chi tiết của thanh toán
  .put(protect, admin, updatePaymentStatus); // Cập nhật trạng thái thanh toán (admin only)

// VNPAY Routes
router.route('/vnpay/create-payment-url')
  .post(protect, createVnpayPayment); // Tạo URL thanh toán VNPAY

router.route('/vnpay/return')
  .get(handleVnpayReturn); // Xử lý kết quả thanh toán VNPAY

module.exports = router;