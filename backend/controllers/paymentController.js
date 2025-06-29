const asyncHandler = require("express-async-handler");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const {
  createVnpayPaymentUrl,
  vnpayConfig,
  sortObject,
} = require("../config/vnpay");
const querystring = require("querystring");
const crypto = require("crypto");

/**
 * @desc    Tạo thanh toán mới
 * @route   POST /api/payments
 * @access  Private
 */
const createPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod, amount, currency, paymentDetails } = req.body;

  // Kiểm tra xem đơn hàng có tồn tại không
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
  }

  // Kiểm tra quyền thanh toán
  if (order.userId !== req.user.id) {
    res.status(401);
    throw new Error("Không có quyền thanh toán đơn hàng này");
  }

  // Tạo thanh toán mới
  const payment = await Payment.create({
    order: orderId,
    user: req.user.id,
    paymentMethod,
    amount,
    currency: currency || "VND",
    status: "pending",
    paymentDetails: paymentDetails || {},
  });

  if (payment) {
    res.status(201).json(payment);
  } else {
    res.status(400);
    throw new Error("Dữ liệu thanh toán không hợp lệ");
  }
});

/**
 * @desc    Lấy thông tin chi tiết của thanh toán
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (payment) {
    if (payment.user === req.user.id || req.user.isAdmin) {
      res.json(payment);
    } else {
      res.status(401);
      throw new Error("Không có quyền truy cập thông tin thanh toán này");
    }
  } else {
    res.status(404);
    throw new Error("Không tìm thấy thanh toán");
  }
});

/**
 * @desc    Lấy tất cả thanh toán của người dùng hiện tại
 * @route   GET /api/payments/my
 * @access  Private
 */
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.findByUser(req.user.id);
  res.json(payments);
});

/**
 * @desc    Lấy tất cả thanh toán (chỉ admin)
 * @route   GET /api/payments
 * @access  Private/Admin
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const allPayments = await Payment.findAll({
    limit: pageSize,
    skip: pageSize * (page - 1),
  });
  // Không có countDocuments, nên trả về tổng số lượng bằng độ dài scan
  const total = (await Payment.findAll({ limit: 10000, skip: 0 })).length;
  res.json({
    payments: allPayments,
    page,
    pages: Math.ceil(total / pageSize),
    total,
  });
});

/**
 * @desc    Cập nhật trạng thái thanh toán
 * @route   PUT /api/payments/:id
 * @access  Private/Admin
 */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status, transactionId } = req.body;
  const payment = await Payment.updateStatus(
    req.params.id,
    status,
    transactionId
  );
  res.json(payment);
});

/**
 * @desc    Tạo URL thanh toán VNPAY
 * @route   POST /api/payments/vnpay/create-payment-url
 * @access  Private
 */
const createVnpayPayment = asyncHandler(async (req, res) => {
  const { orderData } = req.body;
  if (!orderData || !orderData.totalPrice) {
    res.status(400);
    throw new Error("Thiếu thông tin đơn hàng hoặc tổng tiền");
  }
  try {
    // Lấy IP của client
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "127.0.0.1";
    // Đảm bảo amount là số nguyên dương
    const amount = Math.round(orderData.totalPrice);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Số tiền không hợp lệ");
    }
    // Tạo orderId tạm (random, để truyền vào vnpayUrl, sẽ không dùng để tạo đơn hàng thật)
    const tempOrderId = `TMP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    // Tạo URL thanh toán VNPAY
    const vnpayUrl = createVnpayPaymentUrl(tempOrderId, amount, ipAddr);
    res.json({ vnpayUrl });
  } catch (error) {
    res.status(400);
    throw new Error("Không thể tạo URL thanh toán VNPAY: " + error.message);
  }
});

/**
 * @desc    Xử lý kết quả thanh toán VNPAY
 * @route   GET /api/payments/vnpay/return
 * @access  Public
 */
const handleVnpayReturn = asyncHandler(async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    console.log("Received VNPAY params:", vnp_Params);

    // Xóa các tham số không cần thiết
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // Xóa các tham số rỗng và decode các giá trị
    const decodedParams = {};
    Object.keys(vnp_Params).forEach((key) => {
      if (
        vnp_Params[key] !== null &&
        vnp_Params[key] !== undefined &&
        vnp_Params[key] !== ""
      ) {
        decodedParams[key] = decodeURIComponent(
          vnp_Params[key].replace(/\+/g, " ")
        );
      }
    });

    // Sắp xếp các tham số
    const sortedParams = sortObject(decodedParams);

    // Tạo chuỗi ký tự cần kiểm tra
    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join("&");

    // Tạo chữ ký để so sánh
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex")
      .toUpperCase();

    console.log("Received hash:", secureHash);
    console.log("Generated hash:", signed);
    console.log("Raw sign data:", signData);

    if (secureHash === signed) {
      // Lấy orderId từ vnp_OrderInfo (format: "ORDER:orderId")
      const orderInfo = decodedParams["vnp_OrderInfo"];
      console.log("Received order info:", orderInfo);

      const orderId = orderInfo.split(":")[1];
      console.log("Extracted orderId:", orderId);

      const rspCode = decodedParams["vnp_ResponseCode"];
      console.log("Response code:", rspCode);

      // Tìm đơn hàng
      const order = await Order.findById(orderId);
      console.log("Found order:", order ? "Yes" : "No");

      if (!order) {
        console.error("Order not found:", orderId);
        return res.redirect(
          `${process.env.FRONTEND_URL}/payment/vnpay-return?status=failed`
        );
      }

      // Cập nhật trạng thái đơn hàng
      if (rspCode === "00") {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = "completed";
        order.paymentResult = {
          id: decodedParams["vnp_TransactionNo"],
          status: "completed",
          update_time: Date.now(),
        };
        await order.save();

        // Tạo bản ghi thanh toán
        await Payment.create({
          order: orderId,
          user: order.user,
          paymentMethod: "vnpay",
          amount: parseInt(decodedParams["vnp_Amount"]) / 100,
          currency: "VND",
          status: "completed",
          transactionId: decodedParams["vnp_TransactionNo"],
          paymentDetails: {
            bankCode: decodedParams["vnp_BankCode"],
            bankTranNo: decodedParams["vnp_BankTranNo"],
            cardType: decodedParams["vnp_CardType"],
            payDate: decodedParams["vnp_PayDate"],
          },
        });

        console.log(
          "Payment successful, redirecting to:",
          `${process.env.FRONTEND_URL}/payment/vnpay-return?status=completed`
        );
        return res.redirect(
          `${process.env.FRONTEND_URL}/payment/vnpay-return?status=completed`
        );
      } else {
        order.paymentStatus = "failed";
        await order.save();
        console.log(
          "Payment failed, redirecting to:",
          `${process.env.FRONTEND_URL}/payment/vnpay-return?status=failed`
        );
        return res.redirect(
          `${process.env.FRONTEND_URL}/payment/vnpay-return?status=failed`
        );
      }
    } else {
      console.error("Invalid signature:", {
        receivedHash: secureHash,
        calculatedHash: signed,
        signData: signData,
      });
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/vnpay-return?status=failed`
      );
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/vnpay-return?status=failed`
    );
  }
});

module.exports = {
  createPayment,
  getPaymentById,
  getMyPayments,
  getAllPayments,
  updatePaymentStatus,
  createVnpayPayment,
  handleVnpayReturn,
};
