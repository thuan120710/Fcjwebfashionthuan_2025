import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://qk0ka1pe68.execute-api.ap-southeast-1.amazonaws.com/Prod";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tempStatus, setTempStatus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdminView = location.pathname.startsWith("/admin");

  useEffect(() => {
    fetchOrders();
  }, [navigate, user, isAdminView]);

  const fetchOrders = async () => {
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

      const endpoint = isAdminView ? "/api/orders" : "/api/orders/myorders";
      const { data } = await axios.get(`${API_BASE_URL}${endpoint}`, config);

      // Đảm bảo mỗi đơn hàng có trạng thái và sử dụng trạng thái từ server
      const ordersWithStatus = data.map((order) => ({
        ...order,
        status: order.status, // Chỉ sử dụng trạng thái từ server, không set default
      }));

      setOrders(ordersWithStatus);
      setLoading(false);
    } catch (error) {
      setError(
        error.response?.data?.message || "Không thể tải danh sách đơn hàng"
      );
      setLoading(false);
    }
  };

  const handleEditClick = (orderId, currentStatus) => {
    setEditingId(orderId);
    setTempStatus({ ...tempStatus, [orderId]: currentStatus || "pending" });
  };

  const handleCancelEdit = (orderId) => {
    setEditingId(null);
    const currentOrder = orders.find((o) => o.id === orderId);
    setTempStatus({
      ...tempStatus,
      [orderId]: currentOrder?.status || "pending",
    });
  };

  const handleStatusChange = async (orderId) => {
    try {
      setUpdatingStatus(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      const newStatus = tempStatus[orderId];

      const response = await axios.put(
        `${API_BASE_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        config
      );

      if (!response.data || response.data.error) {
        throw new Error(
          response.data?.message || "Không thể cập nhật trạng thái"
        );
      }

      // Cập nhật state với trạng thái mới
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      setEditingId(null);
      setTempStatus((prev) => {
        const newTempStatus = { ...prev };
        delete newTempStatus[orderId];
        return newTempStatus;
      });

      toast.success("Cập nhật trạng thái đơn hàng thành công");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Không thể cập nhật trạng thái đơn hàng");
      // Khôi phục trạng thái cũ nếu có lỗi
      const currentOrder = orders.find((o) => o.id === orderId);
      if (currentOrder) {
        setTempStatus((prev) => ({
          ...prev,
          [orderId]: currentOrder.status,
        }));
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "processing":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "warning";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status; // Trả về trạng thái gốc nếu không match
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetail = (orderId) => {
    const path = isAdminView
      ? `/admin/orders/${orderId}`
      : `/profile/orders/${orderId}`;
    navigate(path);
  };

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom component="h1">
          {isAdminView ? "Quản lý đơn hàng" : "Đơn hàng của tôi"}
        </Typography>

        {orders.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Chưa có đơn hàng nào
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã đơn hàng</TableCell>
                  {isAdminView && <TableCell>Khách hàng</TableCell>}
                  <TableCell>Ngày đặt</TableCell>
                  <TableCell>Tổng tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    {isAdminView && (
                      <TableCell>
                        {order.user?.name || "Không xác định"}
                      </TableCell>
                    )}
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      {(() => {
                        const itemsPrice =
                          order.orderItems?.reduce(
                            (acc, item) =>
                              acc +
                              (Number(item.price) || 0) *
                                (Number(item.quantity) || 0),
                            0
                          ) ||
                          Number(order.itemsPrice) ||
                          0; // Fallback to order.itemsPrice if orderItems is not available
                        const discount = Number(order.discount) || 0;
                        const finalShipping = Math.max(
                          0,
                          (Number(order.shippingPrice) || 0) -
                            (Number(order.shippingDiscount) || 0)
                        );
                        const tax =
                          Number(order.taxPrice) !== 0
                            ? Number(order.taxPrice) || 0
                            : Math.round((itemsPrice - discount) * 0.1);
                        const total =
                          itemsPrice - discount + finalShipping + tax;
                        return total.toLocaleString("vi-VN") + "đ";
                      })()}
                    </TableCell>
                    <TableCell>
                      {isAdminView && editingId === order.id ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={tempStatus[order.id] || order.status}
                              onChange={(e) =>
                                setTempStatus({
                                  ...tempStatus,
                                  [order.id]: e.target.value,
                                })
                              }
                              size="small"
                              disabled={updatingStatus}
                            >
                              <MenuItem value="pending">Chờ xử lý</MenuItem>
                              <MenuItem value="processing">Đang xử lý</MenuItem>
                              <MenuItem value="completed">Hoàn thành</MenuItem>
                              <MenuItem value="cancelled">Đã hủy</MenuItem>
                            </Select>
                          </FormControl>
                          <Tooltip title="Lưu thay đổi">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleStatusChange(order.id)}
                              disabled={updatingStatus}
                            >
                              <SaveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hủy">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelEdit(order.id)}
                              disabled={updatingStatus}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            maxWidth: 200,
                          }}
                        >
                          <Chip
                            label={getStatusText(order.status)}
                            color={getStatusColor(order.status)}
                            size="small"
                            sx={{ minWidth: 90 }}
                          />
                          {isAdminView && (
                            <Tooltip title="Chỉnh sửa trạng thái">
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() =>
                                  handleEditClick(order.id, order.status)
                                }
                                sx={{ ml: 1 }}
                              >
                                Sửa
                              </Button>
                            </Tooltip>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetail(order.id)}
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default OrderList;
