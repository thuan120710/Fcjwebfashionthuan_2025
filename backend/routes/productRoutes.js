const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");

// Route: /api/products
router.route("/").get(getProducts).post(protect, admin, createProduct);

// Route: /api/products/top
router.get("/top", getTopProducts);

// Route: /api/products/:id
router
  .route("/:id")
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

// Route: /api/products/:id/reviews
router.route("/:id/reviews").post(protect, createProductReview);

module.exports = router;
