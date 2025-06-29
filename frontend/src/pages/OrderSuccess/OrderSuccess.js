import React from 'react';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />
        </Box>
        
        <Typography variant="h4" component="h1" color="success.main" gutterBottom>
          Đặt hàng thành công!
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xử lý và sẽ được giao trong thời gian sớm nhất.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Một email xác nhận đã được gửi đến địa chỉ email của bạn với thông tin chi tiết về đơn hàng.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Tiếp tục mua sắm
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => navigate('/profile')}
          >
            Xem đơn hàng
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderSuccess; 