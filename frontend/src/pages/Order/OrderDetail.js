import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton as MuiIconButton,
} from "@mui/material";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import styles from "./OrderDetail.module.css";

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const [imgIndexes, setImgIndexes] = useState({});

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(
          `https://qk0ka1pe68.execute-api.ap-southeast-1.amazonaws.com/Prod/api/orders/${id}`,
          config
        );
        setOrder(data);
      } catch (error) {
        setError(
          error.response?.data?.message || "Không thể tải thông tin đơn hàng"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Đang xử lý":
        return "warning";
      case "Đã giao hàng":
        return "success";
      case "Đã hủy":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className={styles.orderDetailContainer}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className={styles.orderDetailContainer}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" className={styles.orderDetailContainer}>
        <Typography>Không tìm thấy đơn hàng</Typography>
      </Container>
    );
  }

  // --- Start Recalculation Logic ---
  const itemsPrice =
    order.orderItems?.reduce(
      (acc, item) =>
        acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    ) || 0;

  const productDiscount = Number(order.discount) || 0;

  let shippingDiscount = 0;
  if (order.shippingCoupon) {
    if (order.shippingCoupon.discountType === "percentage") {
      const potentialDiscount =
        (itemsPrice * (Number(order.shippingCoupon.discountValue) || 0)) / 100;
      shippingDiscount = order.shippingCoupon.maximumDiscount
        ? Math.min(
            potentialDiscount,
            Number(order.shippingCoupon.maximumDiscount)
          )
        : potentialDiscount;
    } else {
      shippingDiscount = Number(order.shippingCoupon.discountValue) || 0;
    }
  } else {
    shippingDiscount = Number(order.shippingDiscount) || 0;
  }

  const shippingPrice = Number(order.shippingPrice) || 0;
  const finalShipping = Math.max(0, shippingPrice - shippingDiscount);

  const tax = Math.round((itemsPrice - productDiscount) * 0.1);
  const total = itemsPrice - productDiscount + finalShipping + tax;
  // --- End Recalculation Logic ---

  return (
    <Container maxWidth="lg" className={styles.orderDetailContainer}>
      <Paper className={styles.detailPaper}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Chi tiết đơn hàng #{order.id}
            </Typography>
            <Chip
              label={order.status || "Đang xử lý"}
              color={getStatusColor(order.status)}
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Thông tin giao hàng
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>
                <strong>Người nhận:</strong> {order.shippingAddress.fullName}
              </Typography>
              <Typography>
                <strong>Số điện thoại:</strong>{" "}
                {order.shippingAddress.phoneNumber}
              </Typography>
              <Typography>
                <strong>Địa chỉ:</strong> {order.shippingAddress.address}
              </Typography>
              <Typography>
                <strong>Quận/Huyện:</strong> {order.shippingAddress.district}
              </Typography>
              <Typography>
                <strong>Tỉnh/Thành phố:</strong> {order.shippingAddress.city}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Thông tin thanh toán
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>
                <strong>Phương thức:</strong>{" "}
                {order.paymentMethod === "cod"
                  ? "Thanh toán khi nhận hàng"
                  : "Chuyển khoản"}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong>{" "}
                {order.isPaid || order.status === "completed" ? (
                  <Chip
                    label={
                      order.paidAt
                        ? `Đã thanh toán - ${format(
                            new Date(order.paidAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi }
                          )}`
                        : "Đã hoàn thành đơn hàng"
                    }
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip label="Chưa thanh toán" color="warning" size="small" />
                )}
              </Typography>
              <Typography>
                <strong>Ngày đặt hàng:</strong>{" "}
                {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper className={styles.detailPaper}>
        <Typography variant="h6" gutterBottom>
          Sản phẩm đã đặt
        </Typography>
        {order.coupon && (
          <Box className={styles.discountBox}>
            <Typography variant="subtitle1" color="primary">
              Mã giảm giá: {order.coupon.code}
            </Typography>
            <Typography variant="body2">{order.coupon.description}</Typography>
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
        {order.shippingCoupon && (
          <Box className={styles.shippingDiscountBox}>
            <Typography variant="subtitle1" color="primary">
              Mã giảm giá phí vận chuyển: {order.shippingCoupon.code}
            </Typography>
            <Typography variant="body2">
              {order.shippingCoupon.description}
            </Typography>
            <Typography variant="body2">
              Loại:{" "}
              {order.shippingCoupon.discountType === "percentage"
                ? "Phần trăm"
                : "Số tiền cố định"}
            </Typography>
            <Typography variant="body2">
              Giá trị:{" "}
              {order.shippingCoupon.discountType === "percentage"
                ? `${order.shippingCoupon.discountValue}%`
                : `${order.shippingCoupon.discountValue?.toLocaleString()}đ`}
            </Typography>
            <Typography variant="body2" color="error">
              Đã giảm phí ship: -{order.shippingDiscount?.toLocaleString()}đ
            </Typography>
          </Box>
        )}
        <TableContainer className={styles.detailTable}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sản phẩm</TableCell>
                <TableCell align="right">Giá</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell align="right">Tổng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {(() => {
                        const imagesArr =
                          item.images &&
                          Array.isArray(item.images) &&
                          item.images.length > 0
                            ? item.images
                            : item.image
                            ? [item.image]
                            : [];
                        const idx = imgIndexes[item.id] || 0;
                        return imagesArr.length > 1 ? (
                          <Box
                            className={styles.productImageBox}
                            style={{
                              position: "relative",
                              width: 60,
                              height: 60,
                              marginRight: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MuiIconButton
                              size="small"
                              sx={{
                                position: "absolute",
                                left: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                bgcolor: "rgba(255,255,255,0.7)",
                              }}
                              onClick={() =>
                                setImgIndexes((prev) => ({
                                  ...prev,
                                  [item.id]:
                                    (idx - 1 + imagesArr.length) %
                                    imagesArr.length,
                                }))
                              }
                            >
                              <ArrowBackIosNewIcon fontSize="small" />
                            </MuiIconButton>
                            <img
                              src={imagesArr[idx]}
                              alt={item.name}
                              style={{
                                width: 48,
                                height: 48,
                                objectFit: "contain",
                                borderRadius: 4,
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/60";
                              }}
                            />
                            <MuiIconButton
                              size="small"
                              sx={{
                                position: "absolute",
                                right: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                bgcolor: "rgba(255,255,255,0.7)",
                              }}
                              onClick={() =>
                                setImgIndexes((prev) => ({
                                  ...prev,
                                  [item.id]: (idx + 1) % imagesArr.length,
                                }))
                              }
                            >
                              <ArrowForwardIosIcon fontSize="small" />
                            </MuiIconButton>
                          </Box>
                        ) : (
                          <Box className={styles.productImageBox}>
                            <img
                              src={imagesArr[0]}
                              alt={item.name}
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "contain",
                                marginRight: 10,
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/60";
                              }}
                            />
                          </Box>
                        );
                      })()}
                      {item.name}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {item.price.toLocaleString("vi-VN")}đ
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box className={styles.totalBox}>
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">Tạm tính:</Typography>
              {productDiscount > 0 && (
                <Typography variant="subtitle1" color="error">
                  Giảm giá:
                </Typography>
              )}
              <Typography variant="subtitle1">Phí vận chuyển:</Typography>
              {shippingDiscount > 0 && (
                <Typography variant="subtitle1" color="error">
                  Giảm phí vận chuyển:
                </Typography>
              )}
              <Typography variant="subtitle1">Thuế (10%):</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6">Tổng cộng:</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle1" align="right">
                {itemsPrice.toLocaleString("vi-VN")}đ
              </Typography>
              {productDiscount > 0 && (
                <Typography variant="subtitle1" align="right" color="error">
                  -{productDiscount.toLocaleString("vi-VN")}đ
                </Typography>
              )}
              <Typography variant="subtitle1" align="right">
                {finalShipping === 0
                  ? "Miễn phí"
                  : shippingPrice.toLocaleString("vi-VN") + "đ"}
              </Typography>
              {shippingDiscount > 0 && (
                <Typography variant="subtitle1" align="right" color="error">
                  -{shippingDiscount.toLocaleString("vi-VN")}đ
                </Typography>
              )}
              <Typography variant="subtitle1" align="right">
                {tax.toLocaleString("vi-VN")}đ
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" align="right">
                {total.toLocaleString("vi-VN") + "đ"}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderDetail;
