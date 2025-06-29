import axios from "axios";

// Lấy endpoint API từ biến môi trường
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Cấu hình axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để xử lý token
api.interceptors.request.use(
  (config) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API Products
export const getProducts = (params) => api.get("/products", { params });
export const getProductById = (id) => api.get(`/products/${id}`);

// API Users
export const login = (credentials) => api.post("/users/login", credentials);
export const register = (userData) => api.post("/users/register", userData);
export const getUserProfile = () => api.get("/users/profile");
export const updateUserProfile = (userData) =>
  api.put("/users/profile", userData);

// API Cart
export const getCart = () => api.get("/cart");
export const addToCart = (productId, quantity) =>
  api.post("/cart", { productId, quantity });
export const updateCartItem = (productId, quantity) =>
  api.put("/cart", { productId, quantity });
export const removeFromCart = (productId) => api.delete(`/cart/${productId}`);

// API Orders
export const createOrder = (orderData) => api.post("/orders", orderData);
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const getMyOrders = () => api.get("/orders/myorders");

// API Payment
// export const createVNPayUrl = (amount, orderId) => api.post('/payment/create-vnpay-url', { amount, orderId });
// export const verifyVNPayPayment = (params) => api.get('/payment/verify-payment', { params });

export default api;
