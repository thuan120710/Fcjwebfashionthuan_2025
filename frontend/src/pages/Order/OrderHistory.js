import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./OrderHistory.module.css";

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.get("/api/orders/history", config);
        console.log("Order history raw data:", JSON.stringify(data, null, 2));
        setOrderHistory(data);
      } catch (err) {
        console.error("Error fetching order history:", err);
        setError(
          err.response && err.response.data.message
            ? err.response.data.message
            : err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, [user.token]);

  const handleViewOrderDetails = (orderId) => {
    navigate(`/profile/orders/${orderId}`);
  };

  const handleViewProductDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getChipColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      case "processing":
        return "warning";
      default:
        return "primary";
    }
  };

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );

  // Debug: Kiểm tra cấu trúc dữ liệu
  console.log("Order history state:", orderHistory);

  return (
    <Box className={styles.orderHistoryContainer}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 3 }}
        className={styles.sectionTitle}
      >
        Lịch sử đặt hàng
      </Typography>

      {orderHistory.length === 0 ? (
        <Box sx={{ textAlign: "center", p: 5 }}>
          <Typography>Bạn chưa có đơn hàng nào</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orderHistory.map((historyItem) => {
            // Debug: Kiểm tra cấu trúc của từng historyItem
            console.log("History item:", historyItem);
            console.log("Order data:", historyItem.order);
            if (historyItem.order && historyItem.order.orderItems) {
              historyItem.order.orderItems.forEach((item, idx) => {
                console.log(`OrderItem[${idx}]:`, item);
                console.log(`OrderItem[${idx}] product:`, item.product);
              });
            }

            // Kiểm tra nếu không có dữ liệu đơn hàng
            if (!historyItem.order) {
              return (
                <Grid item xs={12} key={historyItem.id}>
                  <Alert severity="warning">
                    Không thể tải thông tin đơn hàng
                  </Alert>
                </Grid>
              );
            }

            return (
              <Grid item xs={12} key={historyItem.id}>
                <Paper elevation={3} className={styles.orderCard}>
                  <Box className={styles.orderHeader}>
                    <Box>
                      <Typography variant="h6" className={styles.sectionTitle}>
                        Mã đơn hàng: {historyItem.order.id}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className={styles.infoText}
                      >
                        Ngày đặt:{" "}
                        {new Date(historyItem.createdAt).toLocaleDateString()}{" "}
                        {new Date(historyItem.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <span className={styles.orderChip}>
                      {historyItem.order?.status || historyItem.status}
                    </span>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Sản phẩm đã đặt:
                  </Typography>

                  {historyItem.order.orderItems &&
                  historyItem.order.orderItems.length > 0 ? (
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      className={styles.orderTable}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="center">Hình ảnh</TableCell>
                            <TableCell align="center">Số lượng</TableCell>
                            <TableCell align="right">Đơn giá</TableCell>
                            <TableCell align="right">Thành tiền</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {historyItem.order.orderItems.map((item, index) => {
                            return (
                              <TableRow
                                key={
                                  item.productId || item.id || `item-${index}`
                                }
                                hover={!!item.productId}
                                onClick={() => {
                                  if (item.productId) {
                                    handleViewProductDetails(item.productId);
                                  } else {
                                    alert("Không tìm thấy ID sản phẩm!");
                                  }
                                }}
                                sx={{
                                  cursor: item.productId
                                    ? "pointer"
                                    : "not-allowed",
                                }}
                              >
                                <TableCell component="th" scope="row">
                                  <Typography variant="body2">
                                    {item.name}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box className={styles.productImageBox}>
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                          objectFit: "contain",
                                        }}
                                      />
                                    ) : (
                                      <Box
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Typography variant="caption">
                                          Không có ảnh
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  {item.quantity}
                                </TableCell>
                                <TableCell align="right">
                                  {item.price?.toLocaleString()}đ
                                </TableCell>
                                <TableCell align="right">
                                  {(
                                    item.price * item.quantity
                                  )?.toLocaleString()}
                                  đ
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Không có thông tin sản phẩm
                    </Alert>
                  )}

                  <Box
                    style={{
                      marginTop: 18,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {historyItem.order.coupon && (
                      <Box className={styles.discountBox}>
                        <Typography variant="subtitle2" color="neutral">
                          Mã giảm giá: {historyItem.order.coupon.code}
                        </Typography>
                        <Typography variant="body2">
                          {historyItem.order.coupon.description}
                        </Typography>
                        <Typography variant="body2">
                          Loại:{" "}
                          {historyItem.order.coupon.discountType ===
                          "percentage"
                            ? "Phần trăm"
                            : "Số tiền cố định"}
                        </Typography>
                        <Typography variant="body2">
                          Giá trị:{" "}
                          {historyItem.order.coupon.discountType ===
                          "percentage"
                            ? `${historyItem.order.coupon.discountValue}%`
                            : `${historyItem.order.coupon.discountValue?.toLocaleString()}đ`}
                        </Typography>
                        <Typography variant="body2" color="error">
                          Đã giảm: -
                          {historyItem.order.discount?.toLocaleString()}đ
                        </Typography>
                      </Box>
                    )}
                    {historyItem.order.shippingCoupon && (
                      <Box className={styles.shippingDiscountBox}>
                        <Typography variant="subtitle2" color="neutral">
                          Mã giảm giá phí vận chuyển:{" "}
                          {historyItem.order.shippingCoupon.code}
                        </Typography>
                        <Typography variant="body2">
                          {historyItem.order.shippingCoupon.description}
                        </Typography>
                        <Typography variant="body2">
                          Loại:{" "}
                          {historyItem.order.shippingCoupon.discountType ===
                          "percentage"
                            ? "Phần trăm"
                            : "Số tiền cố định"}
                        </Typography>
                        <Typography variant="body2">
                          Giá trị:{" "}
                          {historyItem.order.shippingCoupon.discountType ===
                          "percentage"
                            ? `${historyItem.order.shippingCoupon.discountValue}%`
                            : `${historyItem.order.shippingCoupon.discountValue?.toLocaleString()}đ`}
                        </Typography>
                        <Typography variant="body2" color="error">
                          Đã giảm phí ship: -
                          {historyItem.order.shippingDiscount?.toLocaleString()}
                          đ
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        className={styles.orderTotal}
                      >
                        Tổng tiền:{" "}
                        {(() => {
                          const itemsPrice =
                            historyItem.order.orderItems?.reduce(
                              (acc, item) =>
                                acc +
                                (Number(item.price) || 0) *
                                  (Number(item.quantity) || 0),
                              0
                            ) || 0;
                          const discount =
                            Number(historyItem.order.discount) || 0;
                          const finalShipping = Math.max(
                            0,
                            (Number(historyItem.order.shippingPrice) || 0) -
                              (Number(historyItem.order.shippingDiscount) || 0)
                          );
                          const tax = Math.round((itemsPrice - discount) * 0.1);
                          const total =
                            itemsPrice - discount + finalShipping + tax;
                          return total.toLocaleString("vi-VN") + "đ";
                        })()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phương thức thanh toán:{" "}
                        {historyItem.order.paymentMethod}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        handleViewOrderDetails(historyItem.order.id)
                      }
                    >
                      Xem chi tiết đơn hàng
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default OrderHistory;
