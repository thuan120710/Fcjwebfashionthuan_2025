const asyncHandler = require('express-async-handler');
const Address = require('../models/Address');

/**
 * @desc    Lấy tất cả địa chỉ của người dùng hiện tại
 * @route   GET /api/addresses
 * @access  Private
 */
const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id });
  res.json(addresses);
});

/**
 * @desc    Lấy chi tiết địa chỉ theo ID
 * @route   GET /api/addresses/:id
 * @access  Private
 */
const getAddressById = asyncHandler(async (req, res) => {
  const address = await Address.findById(req.params.id);

  if (address) {
    // Kiểm tra xem địa chỉ có thuộc về người dùng hiện tại không
    if (address.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Không có quyền truy cập');
    }
    res.json(address);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy địa chỉ');
  }
});

/**
 * @desc    Tạo địa chỉ mới
 * @route   POST /api/addresses
 * @access  Private
 */
const createAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    phoneNumber,
    isDefault,
    addressType,
  } = req.body;

  // Nếu địa chỉ mới là mặc định, cập nhật tất cả các địa chỉ khác thành không mặc định
  if (isDefault) {
    await Address.updateMany(
      { user: req.user._id, isDefault: true },
      { isDefault: false }
    );
  }

  const address = await Address.create({
    user: req.user._id,
    fullName,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    phoneNumber,
    isDefault: isDefault || false,
    addressType: addressType || 'both',
  });

  if (address) {
    res.status(201).json(address);
  } else {
    res.status(400);
    throw new Error('Dữ liệu địa chỉ không hợp lệ');
  }
});

/**
 * @desc    Cập nhật địa chỉ
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findById(req.params.id);

  if (address) {
    // Kiểm tra xem địa chỉ có thuộc về người dùng hiện tại không
    if (address.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Không có quyền truy cập');
    }

    // Nếu cập nhật thành địa chỉ mặc định, cập nhật tất cả các địa chỉ khác thành không mặc định
    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user._id, isDefault: true },
        { isDefault: false }
      );
    }

    address.fullName = req.body.fullName || address.fullName;
    address.addressLine1 = req.body.addressLine1 || address.addressLine1;
    address.addressLine2 = req.body.addressLine2 || address.addressLine2;
    address.city = req.body.city || address.city;
    address.state = req.body.state || address.state;
    address.postalCode = req.body.postalCode || address.postalCode;
    address.country = req.body.country || address.country;
    address.phoneNumber = req.body.phoneNumber || address.phoneNumber;
    address.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : address.isDefault;
    address.addressType = req.body.addressType || address.addressType;

    const updatedAddress = await address.save();
    res.json(updatedAddress);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy địa chỉ');
  }
});

/**
 * @desc    Xóa địa chỉ
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findById(req.params.id);

  if (address) {
    // Kiểm tra xem địa chỉ có thuộc về người dùng hiện tại không
    if (address.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Không có quyền truy cập');
    }

    await address.remove();
    res.json({ message: 'Địa chỉ đã được xóa' });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy địa chỉ');
  }
});

/**
 * @desc    Lấy tất cả địa chỉ (Admin)
 * @route   GET /api/addresses/all
 * @access  Admin
 */
const getAllAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({}).populate('user', 'id username email');
  res.json(addresses);
});

module.exports = {
  getMyAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  getAllAddresses,
};