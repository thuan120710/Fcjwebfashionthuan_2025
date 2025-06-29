import React, { useState, useEffect, useCallback } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    slug: "",
  });
  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        navigate("/login");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.get("/api/categories", config);
      setCategories(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách danh mục"
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editMode) {
      setSelectedCategory((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setNewCategory((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        navigate("/login");
        return;
      }

      // Kiểm tra quyền admin
      if (!userInfo.isAdmin) {
        setError("Bạn không có quyền xóa danh mục");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.delete(
        `/api/categories/${categoryId}`,
        config
      );

      if (response.data.message) {
        // Hiển thị thông báo thành công
        setSnackbar({
          open: true,
          message: "Xóa danh mục thành công",
          severity: "success",
        });
        // Cập nhật lại danh sách
        fetchCategories();
        setError(null);
      }
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi xóa danh mục",
        severity: "error",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        navigate("/login");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      if (editMode && selectedCategory) {
        // Cập nhật danh mục
        const categoryData = {
          name: selectedCategory.name.trim(),
          description: selectedCategory.description.trim(),
        };

        await axios.put(
          `/api/categories/${selectedCategory.id}`,
          categoryData,
          config
        );
        setSnackbar({
          open: true,
          message: "Cập nhật danh mục thành công",
          severity: "success",
        });
      } else {
        // Thêm danh mục mới
        const categoryData = {
          name: newCategory.name.trim(),
          description: newCategory.description.trim(),
        };

        await axios.post("/api/categories", categoryData, config);
        setSnackbar({
          open: true,
          message: "Thêm danh mục thành công",
          severity: "success",
        });
      }

      setOpenDialog(false);
      setEditMode(false);
      setSelectedCategory(null);
      setNewCategory({
        name: "",
        description: "",
        slug: "",
      });
      fetchCategories();
      setError(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi lưu danh mục",
        severity: "error",
      });
    }
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
              Quản lý danh mục
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              variant="contained"
              onClick={() => {
                setEditMode(false);
                setSelectedCategory(null);
                setNewCategory({
                  name: "",
                  description: "",
                  slug: "",
                });
                setOpenDialog(true);
              }}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
              }}
            >
              Thêm danh mục mới
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
                  <TableCell sx={{ fontWeight: 600 }}>Tên danh mục</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Không có danh mục nào
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id} hover>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Sửa danh mục">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEdit(category)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa danh mục">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(category.id)}
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
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            {editMode ? "Sửa danh mục" : "Thêm danh mục mới"}
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              margin="dense"
              name="name"
              label="Tên danh mục"
              type="text"
              fullWidth
              value={editMode ? selectedCategory?.name : newCategory.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Mô tả"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={
                editMode
                  ? selectedCategory?.description
                  : newCategory.description
              }
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => {
                setOpenDialog(false);
                setEditMode(false);
                setSelectedCategory(null);
              }}
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
              disabled={editMode ? !selectedCategory?.name : !newCategory.name}
              sx={{
                textTransform: "none",
                px: 3,
              }}
            >
              {editMode ? "Lưu thay đổi" : "Thêm danh mục"}
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

export default CategoryManagement;
