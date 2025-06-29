import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BrandManagement = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    isActive: true,
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data } = await axios.get("/api/brands");
      setBrands(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      setError("Lỗi khi tải danh sách thương hiệu");
      console.error("Error fetching brands:", error);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isActive" ? checked : value,
    }));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBrand(null);
    setFormData({
      name: "",
      description: "",
      logo: "",
      isActive: true,
    });
  };

  const handleSubmit = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      if (selectedBrand) {
        await axios.put(`/api/brands/${selectedBrand._id}`, formData, config);
        setSnackbar({
          open: true,
          message: "Cập nhật thương hiệu thành công",
          severity: "success",
        });
      } else {
        await axios.post("/api/brands", formData, config);
        setSnackbar({
          open: true,
          message: "Thêm thương hiệu thành công",
          severity: "success",
        });
      }

      fetchBrands();
      handleCloseDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Có lỗi xảy ra",
        severity: "error",
      });
    }
  };

  const handleDelete = async (brandId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thương hiệu này?")) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      await axios.delete(`/api/brands/${brandId}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });

      setSnackbar({
        open: true,
        message: "Xóa thương hiệu thành công",
        severity: "success",
      });
      fetchBrands();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Lỗi khi xóa thương hiệu",
        severity: "error",
      });
    }
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      logo: brand.logo || "",
      isActive: brand.isActive,
    });
    setOpenDialog(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

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
              Quản lý thương hiệu
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              variant="contained"
              onClick={() => setOpenDialog(true)}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
              }}
            >
              Thêm thương hiệu mới
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
                  <TableCell sx={{ fontWeight: 600 }}>
                    Tên thương hiệu
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Logo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
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
                ) : brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Không có thương hiệu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand) => (
                    <TableRow key={brand._id} hover>
                      <TableCell>{brand.name}</TableCell>
                      <TableCell>{brand.description}</TableCell>
                      <TableCell>
                        {brand.logo && (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "contain",
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {brand.isActive ? "Hoạt động" : "Không hoạt động"}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Sửa thương hiệu">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEdit(brand)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa thương hiệu">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(brand._id)}
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

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 },
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            {selectedBrand ? "Sửa thương hiệu" : "Thêm thương hiệu mới"}
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              margin="dense"
              name="name"
              label="Tên thương hiệu"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Mô tả"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="logo"
              label="URL Logo"
              fullWidth
              value={formData.logo}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            {formData.logo && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Hình ảnh Logo:
                </Typography>
                <img
                  src={formData.logo}
                  alt={formData.name}
                  width="100%"
                  style={{ maxWidth: "300px", marginTop: "10px" }}
                />
              </Box>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  name="isActive"
                />
              }
              label="Hoạt động"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={handleCloseDialog}
              sx={{
                textTransform: "none",
                color: "text.secondary",
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                textTransform: "none",
                px: 3,
              }}
            >
              {selectedBrand ? "Lưu thay đổi" : "Thêm thương hiệu"}
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
              borderRadius: 2,
            }}
            elevation={6}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default BrandManagement;
