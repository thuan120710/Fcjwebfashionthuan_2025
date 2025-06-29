import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo) {
          setError("Vui lòng đăng nhập để xem chi tiết đơn hàng");
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(
          `${API_BASE_URL}/api/orders/${id}`,
          config
        );
        setOrder(data);
        setStatus(data.status);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError(
          error.response?.data?.message || "Không thể tải thông tin đơn hàng"
        );
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.put(
        `${API_BASE_URL}/api/orders/${id}/status`,
        { status: newStatus },
        config
      );
      setStatus(newStatus);
      toast.success("Cập nhật trạng thái thành công!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Không thể cập nhật trạng thái đơn hàng");
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, mb: 8, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/admin/orders")}
          sx={{ mt: 2 }}
        >
          Quay lại quản lý đơn hàng
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="warning">Không tìm thấy đơn hàng</Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/admin/orders")}
          sx={{ mt: 2 }}
        >
          Quay lại quản lý đơn hàng
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        Chi tiết đơn hàng
      </Typography>
      <Typography variant="h6" gutterBottom>
        Mã đơn hàng: {order.id}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sản phẩm đã đặt
            </Typography>
            {order.orderItems.map((item) => (
              <Box key={item.id || item.product} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Box
                      sx={{
                        height: 100,
                        width: "100%",
                        bgcolor: "#f5f5f5",
                        borderRadius: 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                        p: 1,
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/100x100?text=No+Image";
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {item.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography variant="body2" color="text.secondary">
                      SL: {item.quantity}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: "bold", textAlign: "right" }}
                    >
                      {item.price.toLocaleString("vi-VN")}đ
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin đơn hàng
            </Typography>
            {order.coupon && (
              <Box sx={{ my: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Typography variant="subtitle1" color="primary">
                  Mã giảm giá: {order.coupon.code}
                </Typography>
                <Typography variant="body2">
                  {order.coupon.description}
                </Typography>
                <Typography variant="body2">
                  Loại:{" "}
                  {order.coupon.discountType === "percentage"
                    ? "Phần trăm"
                    : "Số tiền cố định"}
                </Typography>
                <Typography variant="body2">
                  Giá trị:{" "}
                  {order.coupon.discountType === "percentage"
                    ? `${order.coupon.discountValue}%`
                    : `${order.coupon.discountValue?.toLocaleString()}đ`}
                </Typography>
                <Typography variant="body2" color="error">
                  Đã giảm: -{order.discount?.toLocaleString()}đ
                </Typography>
              </Box>
            )}
            <Box sx={{ my: 2 }}>
              <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body1">Tạm tính:</Typography>
                <Typography variant="body1">
                  {order.totalPrice.toLocaleString("vi-VN")}đ
                </Typography>
              </Grid>
              <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body1">Phí vận chuyển:</Typography>
                <Typography variant="body1">
                  {order.shippingPrice.toLocaleString("vi-VN")}đ
                </Typography>
              </Grid>
              <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body1">Thuế:</Typography>
                <Typography variant="body1">
                  {order.taxPrice.toLocaleString("vi-VN")}đ
                </Typography>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Grid container justifyContent="space-between">
                <Typography variant="h6">Tổng cộng:</Typography>
                <Typography
                  variant="h6"
                  color="primary.main"
                  sx={{ fontWeight: 600 }}
                >
                  {order.totalPrice.toLocaleString("vi-VN")}đ
                </Typography>
              </Grid>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin giao hàng
            </Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant="body1" paragraph>
                <strong>Địa chỉ:</strong> {order.shippingAddress.address},{" "}
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                , {order.shippingAddress.country}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Phương thức thanh toán:</strong> {order.paymentMethod}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" paragraph>
                <strong>Trạng thái thanh toán:</strong>{" "}
                {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Trạng thái giao hàng:</strong>{" "}
                {order.isDelivered ? "Đã giao hàng" : "Chưa giao hàng"}
              </Typography>
            </Box>
          </Paper>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Trạng thái đơn hàng</InputLabel>
            <Select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              label="Trạng thái đơn hàng"
            >
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="processing">Đang xử lý</MenuItem>
              <MenuItem value="completed">Hoàn thành</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={() => navigate("/admin/orders")}
            sx={{ mt: 2 }}
          >
            Quay lại quản lý đơn hàng
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetail;
