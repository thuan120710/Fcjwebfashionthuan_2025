const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getMyReviews,
  getAllReviews,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route: /api/reviews
router.route('/')
  .post(protect, createReview) // Tạo đánh giá mới
  .get(protect, admin, getAllReviews); // Lấy tất cả đánh giá (admin only)

// Route: /api/reviews/my
router.route('/my').get(protect, getMyReviews); // Lấy đánh giá của người dùng hiện tại

// Route: /api/reviews/product/:productId
router.route('/product/:productId').get(getProductReviews); // Lấy tất cả đánh giá của một sản phẩm

// Route: /api/reviews/:id
router.route('/:id')
  .put(protect, updateReview) // Cập nhật đánh giá
  .delete(protect, deleteReview); // Xóa đánh giá

module.exports = router;