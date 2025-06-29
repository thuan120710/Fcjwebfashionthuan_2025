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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import viLocale from "date-fns/locale/vi";

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    minimumPurchase: 0,
    maximumDiscount: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    isActive: true,
    usageLimit: "",
  });
  const navigate = useNavigate();

  const fetchCoupons = useCallback(async () => {
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

      const { data } = await axios.get("/api/coupons", config);
      setCoupons(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setError(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách mã giảm giá"
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editMode) {
      setSelectedCoupon((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setNewCoupon((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddNew = () => {
    setEditMode(false);
    setNewCoupon({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minimumPurchase: 0,
      maximumDiscount: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      isActive: true,
      usageLimit: "",
    });
    setOpenDialog(true);
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon({
      ...coupon,
      startDate: new Date(coupon.startDate).toISOString().split("T")[0],
      endDate: new Date(coupon.endDate).toISOString().split("T")[0],
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
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
        setError("Bạn không có quyền xóa mã giảm giá");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.delete(`/api/coupons/${couponId}`, config);

      if (response.data.message || response.status === 200) {
        // Hiển thị thông báo thành công
        setSnackbar({
          open: true,
          message: "Xóa mã giảm giá thành công",
          severity: "success",
        });
        // Cập nhật lại danh sách
        fetchCoupons();
        setError(null);
      }
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi xóa mã giảm giá",
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

      // Kiểm tra các trường bắt buộc
      if (
        editMode &&
        (!selectedCoupon?.code ||
          selectedCoupon?.discountValue === undefined ||
          !selectedCoupon?.endDate)
      ) {
        console.error("Validation failed:", {
          code: selectedCoupon?.code,
          discountValue: selectedCoupon?.discountValue,
          endDate: selectedCoupon?.endDate,
        });
        setSnackbar({
          open: true,
          message: "Vui lòng điền đầy đủ thông tin mã giảm giá",
          severity: "error",
        });
        return;
      }

      if (
        !editMode &&
        (!newCoupon.code ||
          newCoupon.discountValue === undefined ||
          !newCoupon.endDate)
      ) {
        console.error("Validation failed:", {
          code: newCoupon.code,
          discountValue: newCoupon.discountValue,
          endDate: newCoupon.endDate,
        });
        setSnackbar({
          open: true,
          message: "Vui lòng điền đầy đủ thông tin mã giảm giá",
          severity: "error",
        });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      let couponData;

      if (editMode && selectedCoupon) {
        // Cập nhật mã giảm giá
        couponData = {
          code: selectedCoupon.code.trim().toUpperCase(),
          description: selectedCoupon.description
            ? selectedCoupon.description.trim()
            : "",
          discountType: selectedCoupon.discountType || "percentage",
          discountValue: parseFloat(selectedCoupon.discountValue) || 0,
          minimumPurchase: parseFloat(selectedCoupon.minimumPurchase) || 0,
          maximumDiscount: selectedCoupon.maximumDiscount
            ? parseFloat(selectedCoupon.maximumDiscount)
            : null,
          startDate: selectedCoupon.startDate
            ? new Date(selectedCoupon.startDate).toISOString()
            : new Date().toISOString(),
          endDate: selectedCoupon.endDate
            ? new Date(selectedCoupon.endDate).toISOString()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive:
            selectedCoupon.isActive !== undefined
              ? selectedCoupon.isActive
              : true,
          usageLimit: selectedCoupon.usageLimit
            ? parseInt(selectedCoupon.usageLimit)
            : null,
        };

        console.log(
          "Updating coupon with data:",
          JSON.stringify(couponData, null, 2)
        );
        try {
          const response = await axios.put(
            `/api/coupons/${selectedCoupon.id}`,
            couponData,
            config
          );
          console.log("Update response:", response.data);
          setSnackbar({
            open: true,
            message: "Cập nhật mã giảm giá thành công",
            severity: "success",
          });
        } catch (error) {
          console.error("Update error:", error.response?.data || error.message);
          throw error;
        }
      } else {
        // Thêm mã giảm giá mới
        couponData = {
          code: newCoupon.code.trim().toUpperCase(),
          description: newCoupon.description
            ? newCoupon.description.trim()
            : "",
          discountType: newCoupon.discountType || "percentage",
          discountValue: parseFloat(newCoupon.discountValue) || 0,
          minimumPurchase: parseFloat(newCoupon.minimumPurchase) || 0,
          maximumDiscount: newCoupon.maximumDiscount
            ? parseFloat(newCoupon.maximumDiscount)
            : null,
          startDate: new Date().toISOString(),
          endDate: newCoupon.endDate
            ? new Date(newCoupon.endDate).toISOString()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          usageLimit: newCoupon.usageLimit
            ? parseInt(newCoupon.usageLimit)
            : null,
        };

        // Đảm bảo có ngày kết thúc hợp lệ và giá trị giảm giá
        if (!couponData.endDate) {
          couponData.endDate = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString();
        }

        if (!couponData.discountValue && couponData.discountValue !== 0) {
          couponData.discountValue = 10; // Giá trị mặc định 10% hoặc 10 đơn vị tiền tệ
        }

        console.log(
          "Creating coupon with data:",
          JSON.stringify(couponData, null, 2)
        );
        try {
          const response = await axios.post("/api/coupons", couponData, config);
          console.log("Create response:", response.data);
          setSnackbar({
            open: true,
            message: "Thêm mã giảm giá thành công",
            severity: "success",
          });
        } catch (error) {
          console.error("Create error:", error.response?.data || error.message);
          throw error;
        }
      }

      setOpenDialog(false);
      setEditMode(false);
      setSelectedCoupon(null);
      setNewCoupon({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        minimumPurchase: 0,
        maximumDiscount: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        isActive: true,
        usageLimit: "",
      });
      fetchCoupons();
    } catch (error) {
      console.error("Submit error:", error.response?.data || error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Có lỗi xảy ra khi lưu mã giảm giá",
        severity: "error",
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedCoupon(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: viLocale });
    } catch (error) {
      console.error("Date format error:", error);
      return "Invalid date";
    }
  };

  const getDiscountText = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    } else {
      return `${coupon.discountValue.toLocaleString("vi-VN")}đ`;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate("/admin")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Quản lý mã giảm giá
        </Typography>
        <Box flexGrow={1} />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
        >
          Thêm mã giảm giá
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã giảm giá</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Giảm giá</TableCell>
                <TableCell>Ngày bắt đầu</TableCell>
                <TableCell>Ngày kết thúc</TableCell>
                <TableCell>Sử dụng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Chưa có mã giảm giá nào
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <Tooltip title={coupon.code} placement="top">
                        <Box fontWeight="bold">{coupon.code}</Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{coupon.description}</TableCell>
                    <TableCell>{getDiscountText(coupon)}</TableCell>
                    <TableCell>{formatDate(coupon.startDate)}</TableCell>
                    <TableCell>{formatDate(coupon.endDate)}</TableCell>
                    <TableCell>
                      {`${coupon.usageCount || 0}${
                        coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""
                      }`}
                    </TableCell>
                    <TableCell>
                      {coupon.isActive ? (
                        <Box sx={{ color: "success.main", fontWeight: "bold" }}>
                          Đang hoạt động
                        </Box>
                      ) : (
                        <Box sx={{ color: "text.disabled" }}>
                          Không hoạt động
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Sửa">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(coupon)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(coupon.id)}
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

      {/* Dialog thêm/sửa mã giảm giá */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? "Cập nhật mã giảm giá" : "Thêm mã giảm giá mới"}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="code"
              label="Mã giảm giá"
              name="code"
              autoFocus
              value={editMode ? selectedCoupon?.code : newCoupon.code}
              onChange={handleInputChange}
              inputProps={{ style: { textTransform: "uppercase" } }}
              helperText="Mã giảm giá sẽ được tự động chuyển thành chữ in hoa"
            />
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Mô tả"
              name="description"
              value={
                editMode ? selectedCoupon?.description : newCoupon.description
              }
              onChange={handleInputChange}
            />

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <FormControl required fullWidth>
                <InputLabel id="discount-type-label">Loại giảm giá</InputLabel>
                <Select
                  labelId="discount-type-label"
                  id="discountType"
                  name="discountType"
                  value={
                    editMode
                      ? selectedCoupon?.discountType
                      : newCoupon.discountType
                  }
                  label="Loại giảm giá"
                  onChange={handleInputChange}
                >
                  <MenuItem value="percentage">Phần trăm (%)</MenuItem>
                  <MenuItem value="fixed_amount">
                    Số tiền cố định (VNĐ)
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                margin="normal"
                required
                fullWidth
                id="discountValue"
                label="Giá trị giảm giá"
                name="discountValue"
                type="number"
                value={
                  editMode
                    ? selectedCoupon?.discountValue
                    : newCoupon.discountValue
                }
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="minimumPurchase"
                label="Giá trị đơn hàng tối thiểu (VNĐ)"
                name="minimumPurchase"
                type="number"
                value={
                  editMode
                    ? selectedCoupon?.minimumPurchase
                    : newCoupon.minimumPurchase
                }
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
              />

              <TextField
                margin="normal"
                fullWidth
                id="maximumDiscount"
                label="Giảm giá tối đa (VNĐ)"
                name="maximumDiscount"
                type="number"
                value={
                  editMode
                    ? selectedCoupon?.maximumDiscount
                    : newCoupon.maximumDiscount
                }
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Để trống nếu không giới hạn"
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="startDate"
                label="Ngày bắt đầu"
                name="startDate"
                type="date"
                value={
                  editMode ? selectedCoupon?.startDate : newCoupon.startDate
                }
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="endDate"
                label="Ngày kết thúc"
                name="endDate"
                type="date"
                value={editMode ? selectedCoupon?.endDate : newCoupon.endDate}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="is-active-label">Trạng thái</InputLabel>
                <Select
                  labelId="is-active-label"
                  id="isActive"
                  name="isActive"
                  value={
                    editMode ? selectedCoupon?.isActive : newCoupon.isActive
                  }
                  label="Trạng thái"
                  onChange={handleInputChange}
                >
                  <MenuItem value={true}>Đang hoạt động</MenuItem>
                  <MenuItem value={false}>Không hoạt động</MenuItem>
                </Select>
              </FormControl>

              <TextField
                margin="normal"
                fullWidth
                id="usageLimit"
                label="Giới hạn sử dụng (lần)"
                name="usageLimit"
                type="number"
                value={
                  editMode ? selectedCoupon?.usageLimit : newCoupon.usageLimit
                }
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Để trống nếu không giới hạn"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CouponManagement;
