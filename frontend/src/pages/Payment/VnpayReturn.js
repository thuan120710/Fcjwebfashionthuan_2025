import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Alert,
  Divider,
} from "@mui/material";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://qk0ka1pe68.execute-api.ap-southeast-1.amazonaws.com/Prod";

const VnpayReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const status = searchParams.get("status");
        setPaymentStatus(status);
        if (status === "completed") {
          // Sau khi thanh toán thành công, tạo đơn hàng
          const orderData = JSON.parse(
            localStorage.getItem("pendingOrderData")
          );
          if (!orderData) {
            setError(
              "Không tìm thấy thông tin đơn hàng để tạo mới sau thanh toán"
            );
            setLoading(false);
            return;
          }
          const userInfo = JSON.parse(localStorage.getItem("userInfo"));
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
              "Content-Type": "application/json",
            },
          };
          try {
            const orderRes = await axios.post(
              `${API_BASE_URL}/api/orders`,
              orderData,
              config
            );
            setOrder(orderRes.data);
            localStorage.removeItem("pendingOrderData");
          } catch (err) {
            setError(
              err.response?.data?.message ||
                "Có lỗi khi tạo đơn hàng sau thanh toán thành công."
            );
            setLoading(false);
            return;
          }
        } else if (status === "failed") {
          setError("Thanh toán thất bại. Đơn hàng chưa được tạo.");
        }
        setLoading(false);
      } catch (error) {
        setError("Có lỗi xảy ra khi kiểm tra trạng thái thanh toán");
        setLoading(false);
      }
    };
    checkPaymentStatus();
  }, [location]);

  const formatCurrency = (amount) =>
    amount ? amount.toLocaleString("vi-VN") + "đ" : "0đ";

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang kiểm tra trạng thái thanh toán...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              {paymentStatus === "completed"
                ? "Thanh toán thành công!"
                : "Thanh toán thất bại"}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {paymentStatus === "completed"
                ? "Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được thanh toán thành công."
                : "Rất tiếc, thanh toán của bạn không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."}
            </Typography>
            {order && (
              <Box mt={3} textAlign="left">
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1">
                  <b>Mã giảm giá:</b> {order.coupon?.code || "Không có"}
                </Typography>
                {order.discount > 0 && (
                  <Typography variant="subtitle1" color="error">
                    <b>Giảm giá:</b> -{formatCurrency(order.discount)}
                  </Typography>
                )}
                <Typography variant="subtitle1">
                  <b>Mã giảm phí ship:</b>{" "}
                  {order.shippingCoupon?.code || "Không có"}
                </Typography>
                {order.shippingDiscount > 0 && (
                  <Typography variant="subtitle1" color="error">
                    <b>Giảm phí ship:</b> -
                    {formatCurrency(order.shippingDiscount)}
                  </Typography>
                )}
                <Typography variant="subtitle1">
                  <b>Phí vận chuyển:</b> {formatCurrency(order.shippingPrice)}
                </Typography>
                <Typography variant="subtitle1">
                  <b>Tổng cộng:</b> {formatCurrency(order.totalPrice)}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/")}
              >
                Tiếp tục mua sắm
              </Button>
              <Button variant="outlined" onClick={() => navigate("/orders")}>
                Xem đơn hàng
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default VnpayReturn;
