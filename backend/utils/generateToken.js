const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token cho người dùng
 * @param {string} id - ID của người dùng
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;