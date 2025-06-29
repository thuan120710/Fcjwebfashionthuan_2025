const express = require('express');
const router = express.Router();
const {
  getMyAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  getAllAddresses,
} = require('../controllers/addressController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route: /api/addresses
router.route('/')
  .get(protect, getMyAddresses)
  .post(protect, createAddress);

// Route: /api/addresses/all (Admin only)
router.route('/all').get(protect, admin, getAllAddresses);

// Route: /api/addresses/:id
router.route('/:id')
  .get(protect, getAddressById)
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

module.exports = router;