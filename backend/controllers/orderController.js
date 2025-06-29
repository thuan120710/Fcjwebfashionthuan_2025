const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const OrderHistory = require("../models/OrderHistory");
const ShippingCoupon = require("../models/ShippingCouponDynamo");
const User = require("../models/User");
const Coupon = require("../models/CouponDynamo");
const sendOrderEmail = require("../utils/sendOrderEmail");

/**
 * @desc    Tạo đơn hàng mới
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice: originalShippingPrice,
    coupon = null,
    discount = 0,
    shippingCoupon = null,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("Không có sản phẩm nào trong đơn hàng");
  }

  // Kiểm tra và xác thực từng sản phẩm
  const validatedItems = [];
  for (const item of orderItems) {
    if (!item.productId) {
      res.status(400);
      throw new Error("Thiếu productId cho sản phẩm trong đơn hàng");
    }
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Không tìm thấy sản phẩm với ID: ${item.productId}`);
    }
    if (product.countInStock < item.quantity) {
      res.status(400);
      throw new Error(
        `Sản phẩm ${product.name} chỉ còn ${product.countInStock} trong kho`
      );
    }
    validatedItems.push({
      ...item,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  }

  // Cập nhật số lượng trong kho
  for (const item of validatedItems) {
    await Product.updateCountInStock(item.productId, -item.quantity);
  }

  // --- TÍNH TOÁN PHÍA SERVER ĐỂ ĐẢM BẢO AN TOÀN ---
  let finalShippingCoupon = null;
  let serverShippingDiscount = 0;
  if (shippingCoupon && shippingCoupon.code) {
    const couponObj = await ShippingCoupon.getCouponByCode(shippingCoupon.code);
    if (!couponObj || !ShippingCoupon.isValid(couponObj)) {
      res.status(400);
      throw new Error(
        "Mã giảm giá phí vận chuyển không hợp lệ hoặc đã hết hạn"
      );
    }
    // FIX 1: Tính toán giảm giá vận chuyển dựa trên tổng giá trị đơn hàng
    serverShippingDiscount = ShippingCoupon.calculateDiscount(
      couponObj,
      itemsPrice
    );
    finalShippingCoupon = couponObj;
  }

  // Phí vận chuyển cuối cùng sau khi giảm giá
  const finalShippingPrice = Math.max(
    0,
    originalShippingPrice - serverShippingDiscount
  );

  // FIX 2: Tính lại tổng tiền cuối cùng một cách chính xác
  const serverTotalPrice =
    (Number(itemsPrice) || 0) -
    (Number(discount) || 0) +
    finalShippingPrice +
    (Number(taxPrice) || 0);

  // Tạo đơn hàng mới với dữ liệu đã được tính toán lại
  const order = await Order.create({
    orderItems: validatedItems,
    userId: req.user.id,
    shippingAddress,
    paymentMethod,
    itemsPrice, // Thêm để lưu lại tạm tính
    taxPrice,
    shippingPrice: originalShippingPrice, // Lưu phí ship gốc
    totalPrice: serverTotalPrice, // Lưu tổng tiền chính xác
    coupon,
    discount,
    shippingCoupon: finalShippingCoupon,
    shippingDiscount: serverShippingDiscount, // Lưu giảm giá ship chính xác
    status: "pending",
    isPaid: false,
    isDelivered: false,
  });

  // Tăng số lượt sử dụng mã giảm giá
  if (coupon && coupon.id) {
    await Coupon.incrementUsageCount(coupon.id);
  }
  if (finalShippingCoupon && finalShippingCoupon.id) {
    await ShippingCoupon.incrementUsageCount(finalShippingCoupon.id);
  }

  // Lưu lịch sử đơn hàng
  await OrderHistory.create({
    userId: req.user.id,
    orderId: order.id,
    status: order.status,
  });

  // Xóa giỏ hàng sau khi đặt hàng thành công
  const cart = await Cart.findOne({ userId: req.user.id });
  if (cart) {
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
  }

  // Gửi email xác nhận đơn hàng cho user
  const user = await User.findById(req.user.id);
  if (user && user.email) {
    try {
      await sendOrderEmail(user.email, order);
    } catch (e) {
      console.error("Gửi email thất bại:", e.message);
    }
  }

  res.status(201).json(order);
});

/**
 * @desc    Lấy đơn hàng theo ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    // Kiểm tra quyền truy cập (chỉ admin hoặc chủ đơn hàng mới được xem)
    if (!req.user.isAdmin && order.userId !== req.user.id) {
      res.status(403);
      throw new Error("Bạn không có quyền xem đơn hàng này");
    }
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
  }
});

/**
 * @desc    Cập nhật trạng thái đơn hàng thành đã thanh toán
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = new Date().toISOString();
    order.paymentResult = req.body.paymentResult || null;
    await order.save();
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
  }
});

/**
 * @desc    Cập nhật trạng thái đơn hàng thành đã giao hàng
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = new Date().toISOString();
    await order.save();
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
  }
});

/**
 * @desc    Lấy tất cả đơn hàng của người dùng đang đăng nhập
 * @route   GET /api/orders/myorders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findByUserId(req.user.id);
  res.json(orders);
});

/**
 * @desc    Lấy tất cả đơn hàng
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll();
  // Lấy thông tin user cho từng order
  const ordersWithUser = await Promise.all(
    orders.map(async (order) => {
      let user = null;
      if (order.userId) {
        const userObj = await User.findById(order.userId);
        if (userObj) {
          user = {
            name:
              userObj.getFullName && userObj.getFullName().trim() !== ""
                ? userObj.getFullName()
                : userObj.username || userObj.email,
            email: userObj.email,
          };
        }
      }
      return { ...order, user };
    })
  );
  res.json(ordersWithUser);
});

/**
 * @desc    Hủy đơn hàng
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
  }
  // Kiểm tra quyền hủy đơn hàng
  if (!req.user.isAdmin && order.userId !== req.user.id) {
    res.status(403);
    throw new Error("Bạn không có quyền hủy đơn hàng này");
  }
  // Chỉ cho phép hủy đơn hàng chưa thanh toán và chưa giao hàng
  if (order.isPaid || order.isDelivered) {
    res.status(400);
    throw new Error("Không thể hủy đơn hàng đã thanh toán hoặc đã giao hàng");
  }
  // Hoàn trả số lượng sản phẩm vào kho
  for (const item of order.orderItems) {
    await Product.updateCountInStock(item.productId, item.quantity);
  }
  // Xóa đơn hàng (DynamoDB: có thể thêm hàm xóa nếu cần)
  // await Order.delete(order.id); // Nếu đã có hàm delete
  res.json({ message: "Đơn hàng đã được hủy (chưa xóa vật lý)" });
});

/**
 * @desc    Cập nhật trạng thái đơn hàng
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
  }
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Bạn không có quyền cập nhật trạng thái đơn hàng");
  }
  const { status } = req.body;
  const validStatuses = ["pending", "processing", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Trạng thái không hợp lệ");
  }
  order.status = status;
  if (status === "completed") {
    order.isDelivered = true;
    order.deliveredAt = new Date().toISOString();
  }
  if (status === "cancelled") {
    for (const item of order.orderItems) {
      await Product.updateCountInStock(item.productId, item.quantity);
    }
  }
  await order.save();
  res.json(order);
});

/**
 * @desc    Xóa sản phẩm khỏi giỏ hàng
 * @route   DELETE /api/carts/:itemId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }
  const itemIndex = cart.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) {
    res.status(404);
    throw new Error("Item not found in cart");
  }
  cart.items.splice(itemIndex, 1);
  await cart.save();
  res.json(cart);
});

/**
 * @desc    Lấy lịch sử đơn hàng của người dùng
 * @route   GET /api/orders/history
 * @access  Private
 */
const getOrderHistory = asyncHandler(async (req, res) => {
  // Lấy lịch sử đơn hàng của user
  const orderHistories = await OrderHistory.findByUserId(req.user.id);
  // Lấy thông tin đơn hàng cho mỗi lịch sử
  const populatedOrderHistories = await Promise.all(
    orderHistories.map(async (history) => {
      const order = await Order.findById(history.orderId);
      return {
        ...history,
        order,
      };
    })
  );
  res.json(populatedOrderHistories);
});

module.exports = {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  cancelOrder,
  updateOrderStatus,
  removeFromCart,
  getOrderHistory,
};
