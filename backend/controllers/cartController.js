const Cart = require("../models/Cart");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

/**
 * @desc    Lấy giỏ hàng của người dùng hiện tại
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  if (cart) {
    res.json(cart);
  } else {
    const newCart = await Cart.create({ userId: req.user.id, items: [] });
    res.json(newCart);
  }
});

/**
 * @desc    Thêm sản phẩm vào giỏ hàng
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, name, price, image } = req.body;
  if (!quantity || typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ message: "Số lượng không hợp lệ" });
  }
  // Lấy thông tin sản phẩm từ DB
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Sản phẩm không tồn tại" });
  }
  // Lấy giỏ hàng
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    cart = await Cart.create({ userId: req.user.id, items: [] });
  }
  const existItem = cart.items.find((item) => item.productId === productId);
  const currentQty = existItem ? existItem.quantity : 0;
  const totalQty = currentQty + quantity;
  if (totalQty > product.countInStock) {
    return res.status(400).json({ message: "Vượt quá số lượng tồn kho" });
  }
  if (existItem) {
    existItem.quantity = totalQty;
  } else {
    cart.items.push({ productId, quantity, name, price, image });
  }
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  await cart.save();
  res.status(201).json(cart);
});

/**
 * @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ message: "Số lượng không hợp lệ" });
  }
  const { itemId } = req.params;
  // Lấy thông tin sản phẩm từ DB
  const product = await Product.findById(itemId);
  if (!product) {
    res.status(404);
    throw new Error("Sản phẩm không tồn tại");
  }
  if (quantity > product.countInStock) {
    return res.status(400).json({ message: "Vượt quá số lượng tồn kho" });
  }
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }
  const cartItem = cart.items.find((item) => item.productId === itemId);
  if (!cartItem) {
    res.status(404);
    throw new Error("Item not found in cart");
  }
  cartItem.quantity = quantity;
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  await cart.save();
  res.json(cart);
});

/**
 * @desc    Xóa sản phẩm khỏi giỏ hàng
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }
  cart.items = cart.items.filter((item) => item.productId !== itemId);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  await cart.save();
  res.json(cart);
});

/**
 * @desc    Xóa toàn bộ giỏ hàng
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();
  res.json({ message: "Cart cleared" });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
