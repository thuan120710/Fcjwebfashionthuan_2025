import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePayment } from "../../context/PaymentContext";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://qk0ka1pe68.execute-api.ap-southeast-1.amazonaws.com/Prod";

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyPayment, paymentStatus } = usePayment();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const verifyPaymentResult = async () => {
      try {
        await verifyPayment(Object.fromEntries(queryParams));
      } catch (error) {
        console.error("Lỗi khi xác thực thanh toán:", error);
      }
    };
    if (queryParams.toString()) {
      verifyPaymentResult();
    }
    // Lấy orderId từ query hoặc localStorage
    const orderId =
      queryParams.get("orderId") ||
      JSON.parse(localStorage.getItem("pendingOrder"))?.orderId;
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (orderId && userInfo?.token) {
      axios
        .get(`${API_BASE_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
        .then((res) => setOrder(res.data))
        .catch(() => {});
    }
  }, [location.search, verifyPayment]);

  const handleContinueShopping = () => {
    navigate("/");
  };

  const formatCurrency = (amount) =>
    amount ? amount.toLocaleString("vi-VN") + "đ" : "0đ";

  return (
    <Container maxWidth="sm" style={{ marginTop: "50px" }}>
      <Paper elevation={3} style={{ padding: "30px", textAlign: "center" }}>
        {paymentStatus.success ? (
          <>
            <CheckCircleIcon
              color="success"
              style={{ fontSize: 60, marginBottom: "20px" }}
            />
            <Typography variant="h5" gutterBottom>
              Thanh toán thành công!
            </Typography>
            <Typography variant="body1" paragraph>
              Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận.
            </Typography>
          </>
        ) : paymentStatus.error ? (
          <>
            <ErrorIcon
              color="error"
              style={{ fontSize: 60, marginBottom: "20px" }}
            />
            <Typography variant="h5" gutterBottom>
              Thanh toán thất bại
            </Typography>
            <Typography variant="body1" color="error" paragraph>
              {paymentStatus.error}
            </Typography>
          </>
        ) : (
          <Typography variant="body1">
            Đang xử lý kết quả thanh toán...
          </Typography>
        )}
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
                <b>Giảm phí ship:</b> -{formatCurrency(order.shippingDiscount)}
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
        <Button
          variant="contained"
          color="primary"
          onClick={handleContinueShopping}
          style={{ marginTop: "20px" }}
        >
          Tiếp tục mua sắm
        </Button>
      </Paper>
    </Container>
  );
};

export default PaymentResult;
