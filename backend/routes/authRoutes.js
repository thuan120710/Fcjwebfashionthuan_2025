const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

// @desc    Bắt đầu quá trình xác thực Google
// @route   GET /api/auth/google
// @access  Public
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// @desc    Callback URL Google redirect sau khi xác thực
// @route   GET /api/auth/google/callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    try {
      // Tạo JWT token
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Trả về token hoặc redirect đến frontend với token
      // Đối với API:
      // res.json({ token });
      
      // Đối với redirect về frontend:
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    } catch (error) {
      console.error('Error creating JWT:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);

// @desc    Kiểm tra người dùng hiện tại
// @route   GET /api/auth/current
// @access  Private
router.get('/current', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      avatar: req.user.avatar || ''
    }
  });
});

module.exports = router; 