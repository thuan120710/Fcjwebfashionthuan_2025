const express = require("express");
const router = express.Router();
const upload = require("../config/multerConfig");
const {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  forgotPassword,
  resetPassword,
  uploadAvatar,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
const passport = require("passport");

// Google OAuth Routes
// 1. Route để bắt đầu đăng nhập Google
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2. Route callback sau khi Google xác thực
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Đăng nhập thành công, tạo token và chuyển hướng người dùng
    const token = generateToken(req.user.id);
    // Chuyển hướng về frontend với token
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  }
);

// Route: /api/users
router.route("/").post(registerUser).get(protect, admin, getUsers);

// Route: /api/users/login
router.post("/login", authUser);

// Route: /api/users/forgot-password
router.post("/forgot-password", forgotPassword);

// Route: /api/users/reset-password/:token
router.post("/reset-password/:token", resetPassword);

// Route: /api/users/profile
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Route: /api/users/profile/upload-avatar
router.post(
  "/profile/upload-avatar",
  protect,
  upload.single("image"),
  uploadAvatar
);

// Route: /api/users/:id
router
  .route("/:id")
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;
