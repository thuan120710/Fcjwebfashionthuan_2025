import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Divider,
  Chip,
  FormHelperText,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Cấu hình axios
axios.defaults.baseURL = API_URL;

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    isAdmin: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hàm kiểm tra mật khẩu
  const validatePassword = (password) => {
    if (!password && editUser) return true; // Nếu đang edit và không thay đổi password

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

  const handleAuthError = useCallback(() => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  }, [navigate]);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const { data } = await axios.get("/api/users", {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 401) {
        handleAuthError();
        return;
      }
      const errorMessage =
        error.response?.data?.message || "Lỗi khi tải danh sách người dùng";
      showSnackbar(errorMessage, "error");
      setLoading(false);
    }
  }, [handleAuthError, showSnackbar]);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.token || !userInfo.isAdmin) {
      navigate("/login");
      return;
    }
    fetchUsers();
  }, [navigate, fetchUsers]);

  const handleOpen = (user = null) => {
    if (user) {
      setEditUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: "",
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      });
    } else {
      setEditUser(null);
      setFormData({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        isAdmin: false,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditUser(null);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isAdmin" ? checked : value,
    }));

    // Kiểm tra mật khẩu khi người dùng đang nhập
    if (name === "password") {
      setPasswordError(validatePassword(value));
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra lại mật khẩu trước khi submit
    const passwordValidation = validatePassword(formData.password);
    if (passwordValidation && (!editUser || formData.password)) {
      setPasswordError(passwordValidation);
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (editUser) {
        // Nếu password trống khi edit user, không gửi password trong request
        const dataToSend = formData.password
          ? formData
          : { ...formData, password: undefined };

        await axios.put(`/api/users/${editUser._id}`, dataToSend, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        showSnackbar("Cập nhật người dùng thành công");
      } else {
        await axios.post("/api/users", formData, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        showSnackbar("Thêm người dùng thành công");
      }
      fetchUsers();
      handleClose();
    } catch (error) {
      if (error.response?.status === 401) {
        handleAuthError();
        return;
      }
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleDelete = useCallback(
    async (userId) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
        return;
      }

      try {
        setDeleteLoading(true);
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo || !userInfo.token) {
          showSnackbar("Vui lòng đăng nhập lại", "error");
          navigate("/login");
          return;
        }

        // Kiểm tra user có tồn tại trong danh sách không
        const userToDelete = users.find((user) => user._id === userId);
        if (!userToDelete) {
          showSnackbar("Không tìm thấy người dùng", "error");
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            "Content-Type": "application/json",
          },
        };

        await axios.delete(`/api/users/${userId}`, config);

        // Cập nhật state sau khi xóa thành công
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== userId)
        );
        showSnackbar("Xóa người dùng thành công", "success");
      } catch (error) {
        console.error("Delete error:", error);

        if (error.response?.status === 401) {
          showSnackbar("Phiên đăng nhập hết hạn", "error");
          navigate("/login");
          return;
        }

        if (error.response?.status === 400) {
          showSnackbar("Không thể xóa tài khoản admin đang đăng nhập", "error");
          return;
        }

        if (error.response?.status === 404) {
          showSnackbar("Không tìm thấy người dùng", "error");
          return;
        }

        showSnackbar(
          error.response?.data?.message || "Lỗi khi xóa người dùng",
          "error"
        );
      } finally {
        setDeleteLoading(false);
      }
    },
    [users, navigate, showSnackbar]
  );

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5", pt: 2, pb: 4 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: "white",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Tooltip title="Quay về Dashboard">
              <IconButton
                onClick={() => navigate("/admin")}
                sx={{
                  color: "primary.main",
                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.04)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Quản lý người dùng
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              variant="contained"
              onClick={() => handleOpen(null)}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
              }}
            >
              Thêm người dùng mới
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Tên người dùng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vai trò</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Không có người dùng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={user.isAdmin ? <AdminIcon /> : null}
                          label={user.isAdmin ? "Quản trị viên" : "Người dùng"}
                          color={user.isAdmin ? "primary" : "default"}
                          size="small"
                          sx={{ minWidth: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Sửa thông tin">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpen(user)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa người dùng">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(user._id)}
                            disabled={user.isAdmin}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editUser ? "Sửa thông tin người dùng" : "Thêm người dùng mới"}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="username"
            label="Tên đăng nhập"
            fullWidth
            value={formData.username}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            required
            disabled
          />
          <TextField
            margin="dense"
            name="password"
            label={
              editUser ? "Mật khẩu (để trống nếu không thay đổi)" : "Mật khẩu"
            }
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleChange}
            required={!editUser}
            error={!!passwordError}
            helperText={
              passwordError || (
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  <InfoIcon
                    fontSize="small"
                    sx={{ mr: 0.5, color: "text.secondary" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Mật khẩu cần có ít nhất 8 ký tự, 1 chữ hoa, 1 số và 1 ký tự
                    đặc biệt
                  </Typography>
                </Box>
              )
            }
          />
          <TextField
            margin="dense"
            name="firstName"
            label="Họ"
            fullWidth
            value={formData.firstName}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="lastName"
            label="Tên"
            fullWidth
            value={formData.lastName}
            onChange={handleChange}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isAdmin}
                onChange={handleChange}
                name="isAdmin"
              />
            }
            label="Là Admin"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!editUser && (!!passwordError || !formData.password)}
          >
            {editUser ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
