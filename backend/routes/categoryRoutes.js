const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Import controllers
// Các controller này sẽ được tạo sau
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

// Route: /api/categories
router.route('/')
  .post(protect, admin, createCategory) // Chỉ admin mới có thể tạo danh mục
  .get(getCategories); // Lấy tất cả danh mục (public)

// Route: /api/categories/:id
router.route('/:id')
  .get(getCategoryById) // Lấy thông tin chi tiết của danh mục
  .put(protect, admin, updateCategory) // Cập nhật danh mục
  .delete(protect, admin, deleteCategory); // Xóa danh mục

module.exports = router;