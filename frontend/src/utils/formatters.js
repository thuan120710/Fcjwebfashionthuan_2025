/**
 * Các hàm tiện ích để định dạng dữ liệu
 */

/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi đã định dạng
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/**
 * Định dạng ngày tháng
 * @param {string|Date} date - Ngày cần định dạng
 * @returns {string} Chuỗi ngày đã định dạng
 */
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Rút gọn văn bản nếu quá dài
 * @param {string} text - Văn bản cần rút gọn
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} Văn bản đã rút gọn
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Chuyển đổi số sao đánh giá thành văn bản
 * @param {number} rating - Số sao đánh giá
 * @returns {string} Mô tả đánh giá
 */
export const ratingToText = (rating) => {
  if (rating >= 4.5) return 'Xuất sắc';
  if (rating >= 4) return 'Rất tốt';
  if (rating >= 3) return 'Tốt';
  if (rating >= 2) return 'Trung bình';
  return 'Kém';
};