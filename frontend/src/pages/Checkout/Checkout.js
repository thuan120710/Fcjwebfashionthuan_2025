import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Paper,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    cart,
    clearCart,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    calculateDiscount,
    finalTotal,
    appliedShippingCoupon,
    applyShippingCoupon,
    removeShippingCoupon,
    calculateShippingDiscount,
  } = useCart();
  const { currentUser } = useAuth();
  const [error, setError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [openCouponDialog, setOpenCouponDialog] = useState(false);
  const [availableShippingCoupons, setAvailableShippingCoupons] = useState([]);
  const [openShippingCouponDialog, setOpenShippingCouponDialog] =
    useState(false);
  const [shippingCouponError, setShippingCouponError] = useState("");

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    district: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const discount = Number(calculateDiscount()) || 0;
  const shippingPrice = 30000; // Luôn là 30k
  const shippingDiscount = appliedShippingCoupon
    ? Number(calculateShippingDiscount(cartTotal)) || 0
    : 0;
  const finalShipping = Math.max(0, shippingPrice - shippingDiscount);
  const tax = Math.round((cartTotal - discount) * 0.1);
  const totalAmount = (Number(cartTotal) || 0) - discount + finalShipping + tax;

  const handleShippingInfoChange = (event) => {
    const { name, value } = event.target;
    setShippingInfo({
      ...shippingInfo,
      [name]: value,
    });
  };

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const isFormValid = () => {
    return (
      shippingInfo.fullName &&
      shippingInfo.phoneNumber &&
      shippingInfo.address &&
      shippingInfo.city &&
      shippingInfo.district
    );
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      setError("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData = {
        orderItems: cart.map((item) => ({
          productId: item.productId || item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image,
        })),
        shippingAddress: {
          fullName: shippingInfo.fullName,
          phoneNumber: shippingInfo.phoneNumber,
          address: shippingInfo.address,
          city: shippingInfo.city,
          district: shippingInfo.district,
          notes: shippingInfo.notes,
          country: "Vietnam",
          postalCode: shippingInfo.district,
        },
        paymentMethod: paymentMethod,
        taxPrice: tax,
        shippingPrice: shippingPrice,
        shippingCoupon: appliedShippingCoupon || null,
        shippingDiscount: shippingDiscount,
        finalShipping: finalShipping,
        itemsPrice: cartTotal,
        discountAmount: discount,
        coupon: appliedCoupon || null,
        discount: discount,
        totalPrice: totalAmount,
      };

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      if (paymentMethod === "vnpay") {
        try {
          // Gọi API tạo payment session VNPAY, truyền orderData
          const vnpayResponse = await axios.post(
            `${API_BASE_URL}/api/payments/vnpay/create-payment-url`,
            { orderData },
            config
          );

          if (vnpayResponse.data.vnpayUrl) {
            // Lưu orderData vào localStorage để dùng sau khi thanh toán thành công
            localStorage.setItem("pendingOrderData", JSON.stringify(orderData));
            window.location.href = vnpayResponse.data.vnpayUrl;
            return;
          } else {
            throw new Error("Không nhận được URL thanh toán từ VNPAY");
          }
        } catch (vnpayError) {
          console.error("VNPAY payment error:", vnpayError);
          setError(
            "Có lỗi xảy ra khi tạo liên kết thanh toán VNPAY. Vui lòng thử lại."
          );
          return;
        } finally {
          setLoading(false);
        }
      } else {
        // Xử lý thanh toán COD như cũ
        const orderResponse = await axios.post(
          `${API_BASE_URL}/api/orders`,
          orderData,
          config
        );
        const orderId = orderResponse.data.id;
        clearCart();
        toast.success("Đặt hàng thành công!");
        navigate(`/order-success?orderId=${orderId}`);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setError(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("vi-VN") + "đ";
  };

  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get("/api/coupons/available", config);
        setAvailableCoupons(data);
      } catch (error) {
        // ignore
      }
    };
    const fetchAvailableShippingCoupons = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get(
          "/api/shipping-coupons/available",
          config
        );
        setAvailableShippingCoupons(data);
      } catch (error) {
        setShippingCouponError(
          error.response?.data?.message ||
            "Không thể tải danh sách mã giảm giá phí vận chuyển"
        );
      }
    };
    if (cart.length > 0) {
      fetchAvailableCoupons();
      fetchAvailableShippingCoupons();
    }
  }, [cart]);

  const handleApplyCoupon = async (coupon) => {
    try {
      setLoading(true);
      setError("");
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/api/coupons/validate",
        {
          code: coupon.code,
          cartTotal: cartTotal,
        },
        config
      );
      applyCoupon(data);
      setOpenCouponDialog(false);
    } catch (error) {
      setError(
        error.response?.data?.message || "Không thể áp dụng mã giảm giá"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
  };

  const handleApplyShippingCoupon = async (coupon) => {
    try {
      setLoading(true);
      setShippingCouponError("");
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/api/shipping-coupons/validate",
        { code: coupon.code, shippingPrice: shippingPrice },
        config
      );
      applyShippingCoupon(data);
      setOpenShippingCouponDialog(false);
    } catch (error) {
      setShippingCouponError(
        error.response?.data?.message ||
          "Không thể áp dụng mã giảm giá phí vận chuyển"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShippingCoupon = () => {
    removeShippingCoupon();
  };

  const formatDiscountText = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `Giảm ${coupon.discountValue}%$${
        coupon.maximumDiscount
          ? ` (tối đa ${coupon.maximumDiscount.toLocaleString("vi-VN")}đ)`
          : ""
      }`;
    }
    return `Giảm ${coupon.discountValue.toLocaleString("vi-VN")}đ`;
  };

  // Kiểm tra nếu giỏ hàng trống
  if (cart.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8, textAlign: "center" }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Giỏ hàng của bạn đang trống
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/")}
          >
            Tiếp tục mua sắm
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Thanh toán
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin giao hàng
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="fullName"
                  name="fullName"
                  label="Họ và tên"
                  fullWidth
                  value={shippingInfo.fullName}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Số điện thoại"
                  fullWidth
                  value={shippingInfo.phoneNumber}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  id="address"
                  name="address"
                  label="Địa chỉ"
                  fullWidth
                  value={shippingInfo.address}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="city"
                  name="city"
                  label="Tỉnh/Thành phố"
                  fullWidth
                  value={shippingInfo.city}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="district"
                  name="district"
                  label="Quận/Huyện"
                  fullWidth
                  value={shippingInfo.district}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="notes"
                  name="notes"
                  label="Ghi chú"
                  fullWidth
                  multiline
                  rows={3}
                  value={shippingInfo.notes}
                  onChange={handleShippingInfoChange}
                  placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay địa điểm giao hàng cụ thể."
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <FormControl component="fieldset">
              <Typography variant="h6" gutterBottom>
                Phương thức thanh toán
              </Typography>
              <RadioGroup
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <FormControlLabel
                  value="cod"
                  control={<Radio />}
                  label="Thanh toán khi nhận hàng (COD)"
                />
                <FormControlLabel
                  value="vnpay"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>Thanh toán qua VNPAY</span>
                      <img
                        src="/vnpay-logo.png"
                        alt="VNPAY"
                        style={{ height: 20 }}
                      />
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tổng quan đơn hàng
            </Typography>
            {appliedCoupon ? (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRemoveCoupon}
                  >
                    Xóa
                  </Button>
                }
              >
                Đã áp dụng mã giảm giá: {appliedCoupon.code}
              </Alert>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setOpenCouponDialog(true)}
                disabled={loading || cart.length === 0}
                sx={{ mb: 1 }}
              >
                Chọn mã giảm giá
              </Button>
            )}
            {appliedShippingCoupon ? (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRemoveShippingCoupon}
                  >
                    Xóa
                  </Button>
                }
              >
                Đã áp dụng mã giảm giá phí vận chuyển:{" "}
                {appliedShippingCoupon.code}
              </Alert>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setOpenShippingCouponDialog(true)}
                disabled={loading || cart.length === 0}
                sx={{ mb: 1 }}
              >
                Chọn mã giảm giá phí vận chuyển
              </Button>
            )}
            <Box sx={{ mb: 2 }}>
              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography>Tạm tính:</Typography>
                </Grid>
                <Grid item>
                  <Typography>{formatCurrency(cartTotal)}</Typography>
                </Grid>
              </Grid>

              {appliedCoupon && (
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography>Giảm giá:</Typography>
                  </Grid>
                  <Grid item>
                    <Typography color="error">
                      -{formatCurrency(discount)}
                    </Typography>
                  </Grid>
                </Grid>
              )}

              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography>Phí vận chuyển:</Typography>
                </Grid>
                <Grid item>
                  <Typography>
                    {finalShipping === 0
                      ? "Miễn phí"
                      : formatCurrency(finalShipping)}
                  </Typography>
                </Grid>
              </Grid>

              {appliedShippingCoupon && (
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography color="error">Giảm phí vận chuyển:</Typography>
                  </Grid>
                  <Grid item>
                    <Typography color="error">
                      -{formatCurrency(shippingDiscount)}
                    </Typography>
                  </Grid>
                </Grid>
              )}

              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography>Thuế (10%):</Typography>
                </Grid>
                <Grid item>
                  <Typography>{formatCurrency(tax)}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography variant="h6">Tổng cộng:</Typography>
                </Grid>
                <Grid item>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handlePlaceOrder}
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Đặt hàng (${formatCurrency(totalAmount)})`
              )}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={openCouponDialog}
        onClose={() => setOpenCouponDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chọn mã giảm giá</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {availableCoupons.map((coupon) => (
                <ListItem
                  key={coupon.code}
                  divider
                  secondaryAction={
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleApplyCoupon(coupon)}
                      disabled={loading}
                    >
                      Áp dụng
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="subtitle1" component="span">
                          {coupon.code}
                        </Typography>
                        {coupon.usageLimit && (
                          <Chip
                            size="small"
                            label={`Còn ${coupon.remainingUses} lượt`}
                            color={
                              coupon.remainingUses < 5 ? "warning" : "default"
                            }
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {formatDiscountText(coupon)}
                        </Typography>
                        {coupon.minimumPurchase > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Đơn tối thiểu{" "}
                            {coupon.minimumPurchase.toLocaleString("vi-VN")}đ
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          HSD:{" "}
                          {new Date(coupon.endDate).toLocaleDateString("vi-VN")}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
              {availableCoupons.length === 0 && (
                <Typography
                  color="text.secondary"
                  align="center"
                  sx={{ py: 3 }}
                >
                  Không có mã giảm giá khả dụng
                </Typography>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCouponDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openShippingCouponDialog}
        onClose={() => setOpenShippingCouponDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chọn mã giảm giá phí vận chuyển</DialogTitle>
        <DialogContent>
          {shippingCouponError && (
            <Alert severity="error">{shippingCouponError}</Alert>
          )}
          {availableShippingCoupons.map((coupon) => (
            <Box
              key={coupon.code}
              sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {coupon.code}
              </Typography>
              <Typography variant="body2">{coupon.description}</Typography>
              <Typography variant="body2">
                {coupon.discountType === "percentage"
                  ? `Giảm ${coupon.discountValue}% phí vận chuyển$${
                      coupon.maximumDiscount
                        ? ` (tối đa ${coupon.maximumDiscount.toLocaleString(
                            "vi-VN"
                          )}đ)`
                        : ""
                    }`
                  : `Giảm ${coupon.discountValue.toLocaleString(
                      "vi-VN"
                    )}đ phí vận chuyển`}
              </Typography>
              {coupon.usageLimit && (
                <Typography variant="body2" color="text.secondary">
                  Còn {coupon.usageLimit - (coupon.usageCount || 0)} /{" "}
                  {coupon.usageLimit} lượt sử dụng
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                HSD: {new Date(coupon.endDate).toLocaleDateString("vi-VN")}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 1 }}
                onClick={() => handleApplyShippingCoupon(coupon)}
                disabled={loading}
              >
                Áp dụng
              </Button>
            </Box>
          ))}
          {availableShippingCoupons.length === 0 && (
            <Typography>
              Không có mã giảm giá phí vận chuyển khả dụng
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShippingCouponDialog(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Checkout;
