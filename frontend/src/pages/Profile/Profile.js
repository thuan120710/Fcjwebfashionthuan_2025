import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  ShoppingBag as ShoppingBagIcon,
  PhotoCamera as PhotoCameraIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Đặt domain backend API Gateway hoặc server Express của bạn ở đây
const BACKEND_URL = process.env.REACT_APP_API_URL;

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(""); // This will hold the blob URL for display
  const [s3AvatarUrl, setS3AvatarUrl] = useState(""); // This will hold the actual S3 URL
  const [editedInfo, setEditedInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();
  const { updateUserAvatar } = useAuth();

  // Helper để lấy URL đầy đủ cho avatar
  const getAvatarUrl = (avatar) => {
    if (!avatar) return "/default-avatar.png";
    if (avatar.startsWith("http")) return avatar; // S3 URL
    // Nếu là đường dẫn uploads, trả về domain backend + path (giữ lại cho trường hợp cũ)
    if (avatar.startsWith("/uploads") || avatar.startsWith("uploads")) {
      const path = avatar.startsWith("/") ? avatar : "/" + avatar;
      return BACKEND_URL + path;
    }
    return avatar;
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      if (!storedUser || !storedUser.token) {
        navigate("/login");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${storedUser.token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.get("/api/users/profile", config);
      setUserInfo(data);

      if (data.avatar) {
        // Set the S3 url to trigger the blob fetching effect
        setS3AvatarUrl(getAvatarUrl(data.avatar));
      } else {
        setAvatarUrl(getAvatarUrl(data.avatar)); // Set default avatar
      }

      setEditedInfo({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi tải thông tin",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // This new useEffect fetches the image as a blob and creates a local URL
  useEffect(() => {
    console.log("Effect triggered. s3AvatarUrl:", s3AvatarUrl);
    if (!s3AvatarUrl) return;

    let objectUrl;
    const fetchImageAsBlob = async () => {
      try {
        console.log("Fetching image from URL:", s3AvatarUrl);
        const response = await fetch(s3AvatarUrl);
        console.log("Fetch response:", response);
        if (!response.ok) {
          throw new Error(`Failed to fetch avatar: ${response.statusText}`);
        }
        const blob = await response.blob();
        console.log("Created blob:", blob);
        objectUrl = URL.createObjectURL(blob);
        console.log("Created blob URL:", objectUrl);
        setAvatarUrl(objectUrl);
      } catch (error) {
        console.error("Error fetching image as blob:", error);
        // Fallback to S3 URL if blob fetch fails
        setAvatarUrl(s3AvatarUrl);
      }
    };

    fetchImageAsBlob();

    // Cleanup function to prevent memory leaks
    return () => {
      if (objectUrl) {
        console.log("Revoking blob URL:", objectUrl);
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [s3AvatarUrl]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleEditClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${storedUser.token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.put(
        "/api/users/profile",
        editedInfo,
        config
      );
      setUserInfo(data);
      setSnackbar({
        open: true,
        message: "Cập nhật thông tin thành công",
        severity: "success",
      });
      setOpenDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật thông tin",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleViewOrders = () => {
    navigate("/profile/orders");
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${storedUser.token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axios.post(
        "/api/users/profile/upload-avatar",
        formData,
        config
      );

      // Set the new S3 url to trigger the blob fetching effect
      setS3AvatarUrl(getAvatarUrl(data.avatar));

      updateUserAvatar(data.avatar);
      setSnackbar({
        open: true,
        message: "Cập nhật ảnh đại diện thành công",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi tải ảnh lên",
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: "16px",
                  border: "2px solid #1976d2",
                }}
              />
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="avatar-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="avatar-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<PhotoCameraIcon />}
                  disabled={uploading}
                >
                  {uploading ? "Đang tải lên..." : "Thay đổi ảnh đại diện"}
                </Button>
              </label>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h4" component="h1">
                Thông tin cá nhân
              </Typography>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
              >
                Chỉnh sửa
              </Button>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Họ và tên"
                  secondary={`${userInfo?.firstName || ""} ${
                    userInfo?.lastName || ""
                  }`}
                />
              </ListItem>
              <Divider variant="inset" component="li" />

              <ListItem>
                <ListItemIcon>
                  <EmailIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={userInfo?.email} />
              </ListItem>
              <Divider variant="inset" component="li" />

              <ListItem>
                <ListItemIcon>
                  <PhoneIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Số điện thoại"
                  secondary={userInfo?.phone || "Chưa cập nhật"}
                />
              </ListItem>
              <Divider variant="inset" component="li" />

              <ListItem>
                <ListItemIcon>
                  <LocationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Địa chỉ"
                  secondary={userInfo?.address || "Chưa cập nhật"}
                />
              </ListItem>
              <Divider variant="inset" component="li" />

              <ListItem button onClick={handleViewOrders}>
                <ListItemIcon>
                  <ShoppingBagIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Đơn hàng của tôi"
                  secondary="Xem lịch sử đơn hàng"
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="Họ"
                fullWidth
                value={editedInfo.firstName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="Tên"
                fullWidth
                value={editedInfo.lastName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                fullWidth
                value={editedInfo.email}
                onChange={handleInputChange}
                type="email"
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="phone"
                label="Số điện thoại"
                fullWidth
                value={editedInfo.phone}
                type="tel"
                inputProps={{ pattern: "[0-9]*", inputMode: "numeric" }}
                onChange={(e) => {
                  // Chỉ cho phép số
                  const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                  setEditedInfo((prev) => ({ ...prev, phone: onlyNums }));
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Địa chỉ"
                fullWidth
                multiline
                rows={3}
                value={editedInfo.address}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
