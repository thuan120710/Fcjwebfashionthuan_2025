import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { PaymentProvider } from "./context/PaymentContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import { Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SearchProvider } from "./context/SearchContext";

// Pages
import Home from "./pages/Home/Home";
import ProductList from "./pages/Product/ProductList";
import ProductDetail from "./pages/Product/ProductDetail";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import OrderSuccess from "./pages/Order/OrderSuccess";
import OrderList from "./pages/Order/OrderList";
import OrderDetail from "./pages/Order/OrderDetail";
import Profile from "./pages/Profile/Profile";
import LoginPage from "./pages/Login/LoginPage";
import RegisterForm from "./components/RegisterForm";
import Categories from "./pages/Categories/Categories";
import PaymentConfirmation from "./pages/Order/PaymentConfirmation";

import OrderHistory from "./pages/Order/OrderHistory";

import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import BrandManagement from "./pages/admin/BrandManagement";
import CouponManagement from "./pages/admin/CouponManagement";
import ShippingCouponManagement from "./pages/admin/ShippingCouponManagement";
import GoogleAuthCallback from "./pages/Auth/GoogleAuthCallback";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import VnpayReturn from "./pages/Payment/VnpayReturn";
import CategoryProductList from "./pages/Categories/CategoryProductList";

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
        style={{ width: "280px" }}
        toastStyle={{
          fontSize: "14px",
          padding: "8px 12px",
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      />
      <SearchProvider>
        <Box
          sx={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            backgroundAttachment: "fixed",
            pt: "64px", // Height of navbar
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AuthProvider>
            <CartProvider>
              <PaymentProvider>
                <Navbar />
                <Box sx={{ flex: 1 }}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route
                      path="/categories/:id"
                      element={<CategoryProductList />}
                    />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route
                      path="/auth/success"
                      element={<GoogleAuthCallback />}
                    />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/reset-password/:token"
                      element={<ResetPassword />}
                    />

                    {/* Protected Routes */}
                    <Route
                      path="/checkout"
                      element={
                        <PrivateRoute>
                          <Checkout />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/payment-confirmation"
                      element={
                        <PrivateRoute>
                          <PaymentConfirmation />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/order-success"
                      element={
                        <PrivateRoute>
                          <OrderSuccess />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/profile/orders"
                      element={
                        <PrivateRoute>
                          <OrderList />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/profile/orders/:id"
                      element={
                        <PrivateRoute>
                          <OrderDetail />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/profile/orders/history"
                      element={
                        <PrivateRoute>
                          <OrderHistory />
                        </PrivateRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <Dashboard />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <AdminRoute>
                          <UserManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/products"
                      element={
                        <AdminRoute>
                          <ProductManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/categories"
                      element={
                        <AdminRoute>
                          <CategoryManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/brands"
                      element={
                        <AdminRoute>
                          <BrandManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <AdminRoute>
                          <OrderList />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/coupons"
                      element={
                        <AdminRoute>
                          <CouponManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/shipping-coupons"
                      element={
                        <AdminRoute>
                          <ShippingCouponManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/orders/:id"
                      element={
                        <AdminRoute>
                          <AdminOrderDetail />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/payment/vnpay-return"
                      element={<VnpayReturn />}
                    />
                  </Routes>
                </Box>
                <Footer />
              </PaymentProvider>
            </CartProvider>
          </AuthProvider>
        </Box>
      </SearchProvider>
    </>
  );
}

export default App;
