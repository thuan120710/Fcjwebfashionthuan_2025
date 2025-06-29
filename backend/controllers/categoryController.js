const Category = require("../models/Category");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Tạo danh mục mới
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, order } = req.body;

  try {
    const category = await Category.create({
      name,
      description,
      image,
      order,
    });

    if (category) {
      res.status(201).json(category);
    } else {
      res.status(400);
      throw new Error("Dữ liệu danh mục không hợp lệ");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message); // Pass the error message from the model
  }
});

/**
 * @desc    Lấy tất cả danh mục
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const { showDeleted, sort } = req.query;

  // Pass filtering and sorting options directly to the model's find method
  const categories = await Category.find({ showDeleted }, { sort });
  res.json(categories);
});

/**
 * @desc    Lấy thông tin chi tiết của danh mục
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    res.json(category);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy danh mục");
  }
});

/**
 * @desc    Cập nhật danh mục
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image, order, isActive } = req.body;

  try {
    const updatedCategory = await Category.updateCategory(req.params.id, {
      name,
      description,
      image,
      order,
      isActive,
    });

    res.json(updatedCategory);
  } catch (error) {
    res.status(400);
    throw new Error(error.message); // Pass the error message from the model
  }
});

/**
 * @desc    Xóa mềm danh mục
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const deletedCategory = await Category.deleteCategory(req.params.id);

    res.json({
      message: "Danh mục đã được xóa thành công",
      category: {
        id: deletedCategory.id, // DynamoDB uses 'id'
        name: deletedCategory.name,
        deletedAt: deletedCategory.deletedAt,
      },
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message); // Pass the error message from the model
  }
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
