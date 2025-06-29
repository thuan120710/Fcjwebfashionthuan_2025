const asyncHandler = require("express-async-handler");
const ReviewDynamo = require("../models/ReviewDynamo");
const Product = require("../models/Product");
const User = require("../models/User");

/**
 * @desc    Tạo đánh giá mới cho sản phẩm
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, title } = req.body;

  // Kiểm tra xem sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }

  // Tạo đánh giá mới trên DynamoDB
  const review = await ReviewDynamo.createReview({
    userId: req.user.id.toString(),
    productId: productId,
    rating: Number(rating),
    comment,
    title: title || "",
  });

  // Cập nhật đánh giá trung bình của sản phẩm
  const reviews = await ReviewDynamo.getReviewsByProduct(productId);
  const totalRating = reviews.reduce(
    (acc, item) => acc + Number(item.rating),
    0
  );
  product.rating = reviews.length > 0 ? totalRating / reviews.length : 0;
  product.numReviews = reviews.length;
  await product.save();

  res.status(201).json({
    message: "Đánh giá đã được thêm",
    review,
  });
});

/**
 * @desc    Lấy tất cả đánh giá của một sản phẩm
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  // Kiểm tra xem sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }

  const reviews = await ReviewDynamo.getReviewsByProduct(productId);

  // Lấy tất cả userId duy nhất
  const userIds = [...new Set(reviews.map((r) => r.userId))];
  // Lấy thông tin user từ DB (không dùng .select nếu không phải Mongoose)
  const users = await User.find({ id: { $in: userIds } });
  const userMap = {};
  users.forEach((u) => {
    userMap[u.id.toString()] = {
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
      _id: u.id.toString(),
    };
  });

  // Gắn thông tin user vào review
  const reviewsWithUser = reviews.map((r) => ({
    ...r,
    user: userMap[r.userId] || null,
  }));

  res.json(reviewsWithUser);
});

/**
 * @desc    Lấy tất cả đánh giá của người dùng hiện tại
 * @route   GET /api/reviews/my
 * @access  Private
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await ReviewDynamo.getReviewsByUser(req.user.id.toString());
  res.json(reviews);
});

/**
 * @desc    Lấy tất cả đánh giá (chỉ admin)
 * @route   GET /api/reviews
 * @access  Private/Admin
 */
const getAllReviews = asyncHandler(async (req, res) => {
  // Lấy tất cả review (không phân trang do scan DynamoDB)
  const reviews = await ReviewDynamo.getAllReviews();
  res.json({ reviews, total: reviews.length });
});

/**
 * @desc    Cập nhật đánh giá
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = asyncHandler(async (req, res) => {
  // Không có kiểm tra userId trong DynamoDB, cần fetch review trước
  const reviews = await ReviewDynamo.getAllReviews();
  const review = reviews.find((r) => r.id === req.params.id);
  if (review && review.userId === req.user.id.toString()) {
    await ReviewDynamo.updateReview(req.params.id, {
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
    });
    // Cập nhật lại rating/numReviews cho product
    const product = await Product.findById(review.productId);
    if (product) {
      const productReviews = await ReviewDynamo.getReviewsByProduct(
        review.productId
      );
      const totalRating = productReviews.reduce(
        (acc, item) => acc + Number(item.rating),
        0
      );
      product.rating =
        productReviews.length > 0 ? totalRating / productReviews.length : 0;
      product.numReviews = productReviews.length;
      await product.save();
    }
    res.json({ message: "Đã cập nhật đánh giá" });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy đánh giá hoặc không có quyền chỉnh sửa");
  }
});

/**
 * @desc    Xóa đánh giá
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  // Không có kiểm tra userId trong DynamoDB, cần fetch review trước
  const reviews = await ReviewDynamo.getAllReviews();
  const review = reviews.find((r) => r.id === req.params.id);
  if (review && review.userId === req.user.id.toString()) {
    await ReviewDynamo.deleteReview(req.params.id);
    // Cập nhật lại rating/numReviews cho product
    const product = await Product.findById(review.productId);
    if (product) {
      const productReviews = await ReviewDynamo.getReviewsByProduct(
        review.productId
      );
      const totalRating = productReviews.reduce(
        (acc, item) => acc + Number(item.rating),
        0
      );
      product.rating =
        productReviews.length > 0 ? totalRating / productReviews.length : 0;
      product.numReviews = productReviews.length;
      await product.save();
    }
    res.json({ message: "Đánh giá đã được xóa" });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy đánh giá hoặc không có quyền xóa");
  }
});

module.exports = {
  createReview,
  getProductReviews,
  getMyReviews,
  getAllReviews,
  updateReview,
  deleteReview,
};
