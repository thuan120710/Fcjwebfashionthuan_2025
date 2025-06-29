import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress, Typography, Container, Paper } from '@mui/material';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processAuthentication = async () => {
      try {
        // Lấy token từ URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          setError('Không có token xác thực. Đăng nhập thất bại.');
          setLoading(false);
          return;
        }
        
        // Đăng nhập với token
        await loginWithToken(token);
        
        // Redirect sau khi đăng nhập thành công
        navigate('/');
      } catch (error) {
        console.error('Google Authentication Error:', error);
        setError('Đăng nhập không thành công. Vui lòng thử lại.');
        setLoading(false);
      }
    };

    processAuthentication();
  }, [location, loginWithToken, navigate]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper elevation={3} sx={{ py: 6, px: 4, borderRadius: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 3 
            }}
          >
            <CircularProgress />
            <Typography variant="h6">Đang xử lý đăng nhập...</Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper elevation={3} sx={{ py: 6, px: 4, borderRadius: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 3 
            }}
          >
            <Typography variant="h6" color="error">{error}</Typography>
            <Typography variant="body1">
              <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
                Quay lại trang đăng nhập
              </a>
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return null;
};

export default GoogleAuthCallback; 