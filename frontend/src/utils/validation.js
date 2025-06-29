import * as Yup from 'yup';

/**
 * Các schema validation cho các form trong ứng dụng
 */

/**
 * Schema xác thực đăng nhập
 */
export const loginSchema = Yup.object({
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập email'),
  password: Yup.string()
    .required('Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

/**
 * Schema xác thực đăng ký
 */
export const registerSchema = Yup.object({
  name: Yup.string()
    .required('Vui lòng nhập họ tên')
    .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập email'),
  password: Yup.string()
    .required('Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Mật khẩu không khớp')
    .required('Vui lòng xác nhận mật khẩu')
});

/**
 * Schema xác thực thông tin thanh toán
 */
export const checkoutSchema = Yup.object({
  fullName: Yup.string()
    .required('Vui lòng nhập họ tên'),
  address: Yup.string()
    .required('Vui lòng nhập địa chỉ'),
  city: Yup.string()
    .required('Vui lòng nhập thành phố'),
  postalCode: Yup.string()
    .required('Vui lòng nhập mã bưu điện'),
  phone: Yup.string()
    .required('Vui lòng nhập số điện thoại')
    .matches(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ')
});

/**
 * Schema xác thực thông tin sản phẩm
 */
export const productReviewSchema = Yup.object({
  rating: Yup.number()
    .required('Vui lòng chọn số sao')
    .min(1, 'Vui lòng chọn số sao')
    .max(5, 'Đánh giá tối đa 5 sao'),
  comment: Yup.string()
    .required('Vui lòng nhập nội dung đánh giá')
    .min(5, 'Nội dung đánh giá quá ngắn')
});