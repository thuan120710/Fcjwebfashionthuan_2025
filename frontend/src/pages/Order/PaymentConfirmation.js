import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaymentOutlined, SecurityOutlined } from '@mui/icons-material';

const PaymentConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder'));

  if (!pendingOrder) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="error">
          Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/checkout')}
          sx={{ mt: 2 }}
        >
          Quay lại trang thanh toán
        </Button>
      </Container>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleConfirmPayment = () => {
    // Chuyển hướng đến URL thanh toán VNPAY
    if (pendingOrder.vnpayUrl) {
      window.location.href = pendingOrder.vnpayUrl;
    }
  };

  const handleCancel = () => {
    // Xóa thông tin pendingOrder và quay lại trang checkout
    localStorage.removeItem('pendingOrder');
    navigate('/checkout');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
          Xác nhận thanh toán
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            Vui lòng kiểm tra lại thông tin đơn hàng trước khi thanh toán qua VNPAY
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Mã đơn hàng:
                  </Typography>
                  <Typography variant="body1">
                    {pendingOrder.orderId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng tiền thanh toán:
                  </Typography>
                  <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(pendingOrder.totalAmount)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin người nhận
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Họ và tên:
                  </Typography>
                  <Typography variant="body1">
                    {pendingOrder.shippingInfo.fullName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Số điện thoại:
                  </Typography>
                  <Typography variant="body1">
                    {pendingOrder.shippingInfo.phoneNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Địa chỉ:
                  </Typography>
                  <Typography variant="body1">
                    {`${pendingOrder.shippingInfo.address}, ${pendingOrder.shippingInfo.district}, ${pendingOrder.shippingInfo.city}`}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityOutlined sx={{ mr: 1 }} />
                Thông tin bảo mật
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                • Thông tin thanh toán của bạn sẽ được bảo mật và xử lý an toàn bởi VNPAY
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Sau khi xác nhận, bạn sẽ được chuyển đến cổng thanh toán VNPAY để hoàn tất giao dịch
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            size="large"
            onClick={handleCancel}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PaymentOutlined />}
            onClick={handleConfirmPayment}
          >
            Xác nhận và Thanh toán
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentConfirmation; 