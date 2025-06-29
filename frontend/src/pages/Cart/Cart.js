import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalOffer as CouponIcon,
} from "@mui/icons-material";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Cart = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
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
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [openCouponDialog, setOpenCouponDialog] = useState(false);
  const [availableShippingCoupons, setAvailableShippingCoupons] = useState([]);
  const [openShippingCouponDialog, setOpenShippingCouponDialog] =
    useState(false);
  const [shippingCouponError, setShippingCouponError] = useState("");

  const shippingPrice = 30000;
  const discount = calculateDiscount();
  const shippingDiscount = appliedShippingCoupon
    ? calculateShippingDiscount(cartTotal)
    : 0;
  const finalShipping = Math.max(0, shippingPrice - shippingDiscount);
  const tax = Math.round((cartTotal - discount) * 0.1);
  const grandTotal = cartTotal - discount + finalShipping + tax;

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo) {
          navigate("/login");
          return;
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };

    fetchCart();
  }, [navigate]);

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
        console.error("Error fetching coupons:", error);
        setError(
          error.response?.data?.message || "Không thể tải danh sách mã giảm giá"
        );
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

  const handleRemoveFromCart = async (productId) => {
    try {
      await removeFromCart(productId);
      removeCoupon();
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const handleUpdateQuantity = async (product, newQuantity) => {
    if (newQuantity >= 1) {
      try {
        await updateQuantity(product.productId, newQuantity);
        removeCoupon();
      } catch (error) {
        console.error("Error updating quantity:", error);
      }
    }
  };

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
      return `Giảm ${coupon.discountValue}%${
        coupon.maximumDiscount
          ? ` (tối đa ${coupon.maximumDiscount.toLocaleString("vi-VN")}đ)`
          : ""
      }`;
    }
    return `Giảm ${coupon.discountValue.toLocaleString("vi-VN")}đ`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        Giỏ Hàng
      </Typography>

      {cart.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", mt: 4 }}>
          <ShoppingCartIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
            Giỏ hàng của bạn hiện tại trống
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/products")}
            sx={{ mt: 2 }}
          >
            Tiếp tục mua sắm
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              {cart.map((product) => (
                <Box key={product.productId} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Box
                        sx={{
                          height: 120,
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
                          src={product.image}
                          alt={product.name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/120x120?text=No+Image";
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                        {product.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {product.description?.substring(0, 100)}
                        {product.description?.length > 100 ? "..." : ""}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        {product.price?.toLocaleString("vi-VN")}đ
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleUpdateQuantity(product, product.quantity - 1)
                          }
                          disabled={product.quantity <= 1}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography
                          sx={{ mx: 2, minWidth: "40px", textAlign: "center" }}
                        >
                          {product.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleUpdateQuantity(product, product.quantity + 1)
                          }
                          disabled={
                            product.quantity >= (product.countInStock || 99)
                          }
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleRemoveFromCart(product.productId)}
                        fullWidth
                      >
                        Xóa
                      </Button>
                    </Grid>
                  </Grid>
                  {cart.indexOf(product) !== cart.length - 1 && (
                    <Divider sx={{ my: 2 }} />
                  )}
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Tổng đơn hàng
              </Typography>

              {/* Product Coupon */}
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
                  startIcon={<CouponIcon />}
                  onClick={() => setOpenCouponDialog(true)}
                  disabled={loading || cart.length === 0}
                  sx={{ mb: 1 }}
                >
                  Chọn mã giảm giá
                </Button>
              )}

              {/* Shipping Coupon */}
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
                  startIcon={<CouponIcon />}
                  onClick={() => setOpenShippingCouponDialog(true)}
                  disabled={loading || cart.length === 0}
                  sx={{ mb: 1 }}
                >
                  Chọn mã giảm giá phí vận chuyển
                </Button>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Summary Details */}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography>Tạm tính:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography align="right">
                    {cartTotal.toLocaleString("vi-VN")}đ
                  </Typography>
                </Grid>

                {appliedCoupon && (
                  <>
                    <Grid item xs={6}>
                      <Typography color="error">Giảm giá:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="error" align="right">
                        -{discount.toLocaleString("vi-VN")}đ
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={6}>
                  <Typography>Phí vận chuyển:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography align="right">
                    {shippingPrice > 0
                      ? `${shippingPrice.toLocaleString("vi-VN")}đ`
                      : "Miễn phí"}
                  </Typography>
                </Grid>

                {appliedShippingCoupon && shippingPrice > 0 && (
                  <>
                    <Grid item xs={6}>
                      <Typography color="error">
                        Giảm phí vận chuyển:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="error" align="right">
                        -{shippingDiscount.toLocaleString("vi-VN")}đ
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={6}>
                  <Typography>Thuế (10%):</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography align="right">
                    {tax.toLocaleString("vi-VN")}đ
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="h6">Tổng cộng:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" align="right" color="primary">
                    {grandTotal.toLocaleString("vi-VN")}đ
                  </Typography>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={() => navigate("/checkout")}
                sx={{ mt: 2 }}
              >
                Tiến hành thanh toán
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Dialog chọn mã giảm giá */}
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

      {/* Dialog chọn mã giảm giá phí vận chuyển */}
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

export default Cart;
