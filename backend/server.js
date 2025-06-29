// Load environment variables first
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const passport = require("./config/passport");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Middleware
app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(passport.initialize());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/shipping-coupons", require("./routes/shippingCouponRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/brands", require("./routes/brandRoutes"));
app.use("/api/addresses", require("./routes/addressRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/uploads", require("express").static(path.join(__dirname, "uploads")));

// Base route
app.get("/", (req, res) => {
  res.send("API is running...");
});

console.log("BRANDS_TABLE_NAME:", process.env.BRANDS_TABLE_NAME);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
