/**
 * Các hàm tiện ích hỗ trợ cho ứng dụng
 */

/**
 * Lấy thông tin từ localStorage với xử lý lỗi
 * @param {string} key - Khóa cần lấy từ localStorage
 * @param {any} defaultValue - Giá trị mặc định nếu không tìm thấy
 * @returns {any} Giá trị đã parse hoặc giá trị mặc định
 */
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Lỗi khi đọc ${key} từ localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Lưu thông tin vào localStorage với xử lý lỗi
 * @param {string} key - Khóa để lưu vào localStorage
 * @param {any} value - Giá trị cần lưu
 * @returns {boolean} Trạng thái thành công
 */
export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Lỗi khi lưu ${key} vào localStorage:`, error);
    return false;
  }
};

/**
 * Tạo URL với các tham số query
 * @param {string} baseUrl - URL cơ sở
 * @param {object} params - Các tham số query
 * @returns {string} URL đã được tạo
 */
export const createUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

/**
 * Kiểm tra xem thiết bị hiện tại có phải là thiết bị di động hay không
 * @returns {boolean} True nếu là thiết bị di động
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Tạo ID ngẫu nhiên
 * @param {number} length - Độ dài của ID
 * @returns {string} ID ngẫu nhiên
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};