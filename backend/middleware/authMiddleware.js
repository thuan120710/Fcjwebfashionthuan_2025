const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

/**
 * Middleware xác thực người dùng
 * Kiểm tra token JWT trong header và xác thực người dùng
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Kiểm tra header Authorization có Bearer token không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin user từ id trong token (không bao gồm password)
      req.user = await User.findById(decoded.id);
      console.log(
        "User isAdmin status:",
        req.user ? req.user.isAdmin : "User not found"
      );

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

/**
 * Middleware kiểm tra quyền admin
 * Phải sử dụng sau middleware protect
 */
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error("Không có quyền truy cập");
  }
};

module.exports = { protect, admin };
