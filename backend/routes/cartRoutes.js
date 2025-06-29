const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import controllers
// Các controller này sẽ được tạo sau
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

// Route: /api/cart
router
  .route("/")
  .get(protect, getCart) // Get user's cart
  .post(protect, addToCart) // Add product to cart
  .delete(protect, clearCart); // Clear the cart

// Route: /api/cart/:itemId
router
  .route("/:itemId")
  .put(protect, updateCartItem) // Update cart item quantity
  .delete(protect, removeFromCart); // Remove item from cart

module.exports = router;
