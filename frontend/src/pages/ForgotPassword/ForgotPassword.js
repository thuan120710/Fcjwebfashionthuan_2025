import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await axios.post('/api/users/forgot-password', { email });
      setMessage(data.message);
      setEmail(''); // Clear email field after success
    } catch (error) {
      setError(
        error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Quên mật khẩu
        </Typography>

        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Nhập địa chỉ email của bạn dưới đây. Chúng tôi sẽ gửi một liên kết đến email của bạn để đặt lại mật khẩu.
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
            <Typography variant="body2" sx={{ mt: 1 }}>
              Vui lòng kiểm tra hộp thư đến và thư rác trong email của bạn.
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Địa chỉ email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            error={!!error}
            helperText={error && error.includes('email') ? error : ''}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 3, 
              mb: 2,
              height: 48,
              borderRadius: 2,
              position: 'relative'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    marginLeft: '-12px'
                  }}
                />
                Đang xử lý...
              </>
            ) : (
              'Gửi liên kết đặt lại mật khẩu'
            )}
          </Button>

          <Box textAlign="center">
            <Link 
              component={RouterLink} 
              to="/login" 
              variant="body2"
              sx={{ 
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              ← Quay lại đăng nhập
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPassword; 