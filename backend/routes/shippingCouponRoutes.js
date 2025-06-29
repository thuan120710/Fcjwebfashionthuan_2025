const express = require("express");
const router = express.Router();
const {
  createShippingCoupon,
  getShippingCoupons,
  getShippingCouponById,
  updateShippingCoupon,
  deleteShippingCoupon,
  validateShippingCoupon,
  applyShippingCoupon,
  getAvailableShippingCoupons,
} = require("../controllers/shippingCouponController");
const { protect, admin } = require("../middleware/authMiddleware");

// Route: /api/shipping-coupons
router
  .route("/")
  .post(protect, admin, createShippingCoupon)
  .get(protect, admin, getShippingCoupons);

// Route: /api/shipping-coupons/available
router.get("/available", protect, getAvailableShippingCoupons);

// Route: /api/shipping-coupons/validate
router.route("/validate").post(protect, validateShippingCoupon);

// Route: /api/shipping-coupons/apply
router.route("/apply").post(protect, applyShippingCoupon);

// Route: /api/shipping-coupons/:id
router
  .route("/:id")
  .get(protect, admin, getShippingCouponById)
  .put(protect, admin, updateShippingCoupon)
  .delete(protect, admin, deleteShippingCoupon);

module.exports = router;
