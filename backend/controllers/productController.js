const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

// No longer need to import AWS SDK and DynamoDB DocumentClient directly in controller
// as they are handled within the Product model itself.
// const AWS = require("aws-sdk");
// AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" });
// const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**
 * Lấy tất cả sản phẩm
 * GET /api/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 8; // 2 hàng * 4 sản phẩm/hàng = 8 sản phẩm/trang
  const page = Number(req.query.pageNumber) || 1;
  const {
    showDeleted,
    keyword,
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    sort,
  } = req.query;

  // Xây dựng điều kiện tìm kiếm cho DynamoDB
  const query = {};
  const options = {};

  // Lọc theo trạng thái xóa
  if (showDeleted && showDeleted.toLowerCase() === "true") {
    query.isDeleted = true;
  } else {
    query.isDeleted = false; // Default to not showing deleted products
  }

  // Tìm kiếm theo từ khóa (ưu tiên keyword, fallback search)
  const searchTerm = keyword || search;
  if (searchTerm) {
    query.name = { $regex: searchTerm, $options: "i" };
  }

  // Lọc theo danh mục và thương hiệu (lưu ý: IDs, không phải ObjectId)
  if (category) {
    query.category = category;
  }

  if (brand) {
    query.brand = brand;
  }

  // Lọc theo giá
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Sắp xếp
  if (sort) {
    switch (sort) {
      case "price_asc":
        options.sort = { price: 1 };
        break;
      case "price_desc":
        options.sort = { price: -1 };
        break;
      case "rating":
        options.sort = { rating: -1 };
        break;
      case "newest":
        options.sort = { createdAt: -1 };
        break;
      default:
        options.sort = { createdAt: -1 };
    }
  }

  // Phân trang
  options.limit = pageSize;
  options.skip = pageSize * (page - 1);

  const { products, count } = await Product.find(query, options); // Gọi phương thức find mới

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    totalProducts: count,
  });
});

/**
 * Lấy sản phẩm theo ID
 *  GET /api/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  // Không còn populate vì DynamoDB không hỗ trợ join như MongoDB. Brand/Category sẽ là IDs.
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }
});

/**
 * Xóa mềm sản phẩm
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  // Use static method deleteProduct from Product model
  try {
    const deletedProduct = await Product.deleteProduct(req.params.id);

    res.json({
      message: "Sản phẩm đã được xóa thành công",
      product: {
        id: deletedProduct.id, // DynamoDB uses 'id' instead of '_id'
        name: deletedProduct.name,
        deletedAt: deletedProduct.deletedAt,
      },
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message); // Pass the error message from the model
  }
});

/**
 * Tạo sản phẩm mới
 * POST /api/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    images,
    brand,
    category,
    countInStock,
  } = req.body;
  // Xử lý images: nhận mảng hoặc string (textarea)
  const imagesArr = Array.isArray(images)
    ? images
    : typeof images === "string" && images
    ? images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : image
    ? [image]
    : [];
  const mainImage = imagesArr[0] || image || "";
  // Kiểm tra dữ liệu có hợp lệ không
  if (
    !name ||
    !price ||
    !description ||
    imagesArr.length === 0 ||
    !brand ||
    !category ||
    countInStock === undefined
  ) {
    res.status(400);
    throw new Error("Thiếu thông tin sản phẩm");
  }
  try {
    const newProduct = new Product({
      name,
      price,
      description,
      images: imagesArr,
      image: mainImage,
      brand,
      category,
      countInStock: Number(countInStock),
      rating: 0,
      numReviews: 0,
      isDeleted: false,
      deletedAt: null,
    });
    const product = await newProduct.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm vào DynamoDB:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi thêm sản phẩm", error: error.message });
  }
});

/**
 Cập nhật sản phẩm
 PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    images,
    brand,
    category,
    countInStock,
  } = req.body;
  // Xử lý images: nhận mảng hoặc string (textarea)
  const imagesArr = Array.isArray(images)
    ? images
    : typeof images === "string" && images
    ? images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : image
    ? [image]
    : [];
  const mainImage = imagesArr[0] || image || "";
  try {
    const updatedProduct = await Product.updateProduct(req.params.id, {
      name,
      price,
      description,
      images: imagesArr,
      image: mainImage,
      brand,
      category,
      countInStock: Number(countInStock),
    });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
Tạo đánh giá cho sản phẩm
POST /api/products/:id/reviews

 */
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    // reviews là mảng nhúng trong DynamoDB
    const alreadyReviewed = product.reviews.find(
      (r) => r.user === req.user.id // Dùng user.id thay vì user._id
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Bạn đã đánh giá sản phẩm này rồi");
    }

    const review = {
      name: req.user.firstName + " " + req.user.lastName,
      rating: Number(rating),
      comment,
      user: req.user.id,
      createdAt: new Date().toISOString(),
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Đánh giá đã được thêm" });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }
});

// Lấy các sản phẩm bán chạy nhất
const getTopProducts = asyncHandler(async (req, res) => {
  // With DynamoDB and Product.find (scan), we will get all and sort. The Product.find method will handle limit.
  const { products } = await Product.find(
    {}, // No specific query for top products, as sorting will handle it
    { sort: { rating: -1 }, limit: 5 }
  );

  res.json(products);
});

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
};
