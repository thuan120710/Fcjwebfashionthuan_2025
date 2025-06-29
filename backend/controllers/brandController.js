const asyncHandler = require("express-async-handler");
const Brand = require("../models/Brand");

/**
 * @desc    Tạo thương hiệu mới
 * @route   POST /api/brands
 * @access  Private/Admin
 */
const createBrand = asyncHandler(async (req, res) => {
  const { name, description, logo, website, country, featured } = req.body;

  // Kiểm tra xem thương hiệu đã tồn tại chưa (bao gồm cả đã xóa mềm)
  const brandExists = await Brand.findOne({ name });

  if (brandExists) {
    res.status(400);
    throw new Error("Thương hiệu đã tồn tại");
  }

  // Tạo slug từ tên thương hiệu
  const slug = Brand.createSlug(name);

  // Kiểm tra xem slug đã tồn tại chưa (bao gồm cả đã xóa mềm)
  const slugExists = await Brand.findOne({ slug });
  if (slugExists) {
    res.status(400);
    throw new Error("Slug đã tồn tại, vui lòng chọn tên khác");
  }

  const brand = await Brand.create({
    name,
    description,
    slug,
    logo,
    website,
    country,
    featured: featured || false,
    isActive: true,
    isDeleted: false,
    deletedAt: null,
  });

  if (brand) {
    res.status(201).json(brand);
  } else {
    res.status(400);
    throw new Error("Dữ liệu thương hiệu không hợp lệ");
  }
});

/**
 * @desc    Lấy tất cả thương hiệu
 * @route   GET /api/brands
 * @access  Public
 */
const getBrands = asyncHandler(async (req, res) => {
  try {
    console.log("Entering getBrands controller");
    const { showDeleted, sort, featured } = req.query;

    const query = {};

    if (!showDeleted) {
      query.isDeleted = false;
    }

    if (featured === "true") {
      query.featured = true;
    }

    let sortOption = { name: 1 };
    if (sort) {
      switch (sort) {
        case "name_asc":
          sortOption = { name: 1 };
          break;
        case "name_desc":
          sortOption = { name: -1 };
          break;
        case "newest":
          sortOption = { createdAt: -1 };
          break;
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "featured":
          sortOption = { featured: -1, name: 1 };
          break;
      }
    }

    console.log("Querying Brands with:", { query, sortOption });
    const brands = await Brand.find(query);
    console.log("Successfully fetched brands:", brands.length);
    res.json(brands);
  } catch (error) {
    console.error("Error in getBrands controller:", error);
    res.status(500); // Set status to 500 for internal server error
    throw new Error("Lỗi khi lấy danh sách thương hiệu");
  }
});

/**
 * @desc    Lấy thông tin chi tiết của thương hiệu
 * @route   GET /api/brands/:id
 * @access  Public
 */
const getBrandById = asyncHandler(async (req, res) => {
  const { showDeleted } = req.query;
  const query = { id: req.params.id };

  // Nếu không yêu cầu hiển thị thương hiệu đã xóa, chỉ lấy thương hiệu chưa xóa
  if (!showDeleted) {
    query.isDeleted = false;
  }

  const brand = await Brand.findOne(query);

  if (brand) {
    res.json(brand);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy thương hiệu");
  }
});

/**
 * @desc    Cập nhật thương hiệu
 * @route   PUT /api/brands/:id
 * @access  Private/Admin
 */
const updateBrand = asyncHandler(async (req, res) => {
  const { name, description, logo, website, country, featured, isActive } =
    req.body;

  // Tìm thương hiệu bao gồm cả đã xóa mềm
  const brand = await Brand.findOne({ id: req.params.id });

  if (!brand) {
    res.status(404);
    throw new Error("Không tìm thấy thương hiệu");
  }

  // Nếu thương hiệu đã bị xóa mềm, không cho phép cập nhật
  if (brand.isDeleted) {
    res.status(400);
    throw new Error("Không thể cập nhật thương hiệu đã bị xóa");
  }

  // Kiểm tra xem tên mới đã tồn tại chưa (nếu tên thay đổi)
  if (name && name !== brand.name) {
    const brandExists = await Brand.findOne({
      name,
      id: { $ne: brand.id }, // Loại trừ thương hiệu hiện tại
    });
    if (brandExists) {
      res.status(400);
      throw new Error("Tên thương hiệu đã tồn tại");
    }
    // Cập nhật slug khi tên thay đổi
    brand.slug = Brand.createSlug(name);
  }

  brand.name = name || brand.name;
  brand.description = description || brand.description;
  brand.logo = logo || brand.logo;
  brand.website = website || brand.website;
  brand.country = country || brand.country;
  brand.featured = featured !== undefined ? featured : brand.featured;
  brand.isActive = isActive !== undefined ? isActive : brand.isActive;

  const updatedBrand = await brand.save();
  res.json(updatedBrand);
});

/**
 * @desc    Xóa mềm thương hiệu
 * @route   DELETE /api/brands/:id
 * @access  Private/Admin
 */
const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ id: req.params.id });

  if (!brand) {
    res.status(404);
    throw new Error("Không tìm thấy thương hiệu");
  }

  // Nếu thương hiệu đã bị xóa mềm
  if (brand.isDeleted) {
    res.status(400);
    throw new Error("Thương hiệu đã bị xóa trước đó");
  }

  // Thực hiện xóa mềm
  brand.isDeleted = true;
  brand.deletedAt = new Date();
  await brand.save();

  res.json({
    message: "Thương hiệu đã được xóa thành công",
    brand: {
      id: brand.id,
      name: brand.name,
      deletedAt: brand.deletedAt,
    },
  });
});

module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
