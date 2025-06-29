import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
  FormHelperText,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
    email: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, error } = useAuth();
  const navigate = useNavigate();

  // Hàm kiểm tra mật khẩu
  const validatePassword = (password) => {
    if (!password) return "Mật khẩu là bắt buộc";

    // Ít nhất 8 ký tự
    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự";
    }

    // Phải có ít nhất 1 chữ hoa
    if (!/[A-Z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ hoa";
    }

    // Phải có ít nhất 1 số
    if (!/[0-9]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 số";
    }

    // Phải có ít nhất 1 ký tự đặc biệt
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
    }

    return ""; // Mật khẩu hợp lệ
  };

  // Kiểm tra email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email là bắt buộc";
    if (!emailRegex.test(email)) return "Email không hợp lệ";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Kiểm tra mật khẩu trong thời gian thực
    if (name === "password") {
      const passwordError = validatePassword(value);
      setErrors({
        ...errors,
        password: passwordError,
        confirmPassword:
          value !== formData.confirmPassword && formData.confirmPassword
            ? "Mật khẩu không khớp"
            : "",
      });
    }

    // Kiểm tra xác nhận mật khẩu
    if (name === "confirmPassword") {
      setErrors({
        ...errors,
        confirmPassword:
          value !== formData.password ? "Mật khẩu không khớp" : "",
      });
    }

    // Kiểm tra email
    if (name === "email") {
      setErrors({
        ...errors,
        email: validateEmail(value),
      });
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra lại tất cả các trường khi submit
    const passwordError = validatePassword(formData.password);
    const emailError = validateEmail(formData.email);
    const confirmPasswordError =
      formData.password !== formData.confirmPassword
        ? "Mật khẩu không khớp"
        : "";

    // Nếu có lỗi, cập nhật state và dừng submit
    if (passwordError || emailError || confirmPasswordError) {
      setErrors({
        password: passwordError,
        email: emailError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      navigate("/");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  // Kiểm tra nút đăng ký có được kích hoạt hay không
  const isRegisterDisabled = () => {
    return (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.firstName ||
      !formData.lastName ||
      errors.password ||
      errors.email ||
      errors.confirmPassword
    );
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Đăng ký tài khoản
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Tên đăng nhập"
            name="username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="Họ"
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="lastName"
            label="Tên"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {!errors.password && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 0.5, mb: 1 }}>
              <InfoIcon
                fontSize="small"
                sx={{ mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="caption" color="text.secondary">
                Mật khẩu cần có ít nhất 8 ký tự, 1 chữ hoa, 1 số và 1 ký tự đặc
                biệt
              </Typography>
            </Box>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleToggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isRegisterDisabled()}
          >
            Đăng ký
          </Button>
          <Button fullWidth variant="text" onClick={() => navigate("/login")}>
            Đã có tài khoản? Đăng nhập
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterForm;
