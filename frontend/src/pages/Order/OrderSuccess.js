import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Divider,
} from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState(null);

  // Lấy orderId từ URL hoặc từ localStorage
  const orderId =
    new URLSearchParams(location.search).get("orderId") ||
    JSON.parse(localStorage.getItem("pendingOrder"))?.orderId;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        const data = await response.json();
        setOrderDetails(data);

        // Kiểm tra nếu là thanh toán VNPAY thành công
        const pendingOrder = JSON.parse(localStorage.getItem("pendingOrder"));
        if (pendingOrder && pendingOrder.paymentMethod === "vnpay") {
          // Hiển thị thông báo thành công
          toast.success("Thanh toán VNPAY thành công!");
          // Xóa thông tin pendingOrder
          localStorage.removeItem("pendingOrder");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Không thể tải thông tin đơn hàng");
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleViewOrder = () => {
    if (user?.role === "admin") {
      navigate(`/admin/orders/${orderId}`);
    } else {
      navigate(`/profile/orders/${orderId}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <CheckCircleIcon sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Thanh toán thành công!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xác nhận và sẽ được
          xử lý trong thời gian sớm nhất.
        </Typography>

        {orderDetails && (
          <Box sx={{ mt: 3, mb: 3, textAlign: "left" }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Thông tin đơn hàng:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mã đơn hàng: {orderDetails.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng tiền: {formatCurrency(orderDetails.totalPrice)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phương thức thanh toán:{" "}
              {orderDetails.paymentMethod === "vnpay"
                ? "VNPAY"
                : "Thanh toán khi nhận hàng"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trạng thái:{" "}
              {orderDetails.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
            </Typography>
            <Divider sx={{ mt: 2 }} />
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" paragraph>
          Một email xác nhận đã được gửi đến địa chỉ email của bạn với thông tin
          chi tiết về đơn hàng.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleViewOrder}
            sx={{ mr: 2 }}
          >
            XEM CHI TIẾT ĐƠN HÀNG
          </Button>
          <Button variant="outlined" onClick={() => navigate("/products")}>
            TIẾP TỤC MUA SẮM
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderSuccess;
