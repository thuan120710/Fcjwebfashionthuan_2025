import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
  LocalOffer as LocalOfferIcon,
  CardGiftcard as CardGiftcardIcon,
  LocalShipping as LocalShippingIcon,
} from "@mui/icons-material";

const Dashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Quản lý người dùng",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      description: "Xem và quản lý tài khoản người dùng",
      path: "/admin/users",
      color: "#2196f3",
      buttonColor: "#2196f3",
    },
    {
      title: "Quản lý sản phẩm",
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      description: "Thêm, sửa, xóa sản phẩm",
      path: "/admin/products",
      color: "#4caf50",
      buttonColor: "#4caf50",
    },
    {
      title: "Quản lý danh mục",
      icon: <CategoryIcon sx={{ fontSize: 40 }} />,
      description: "Quản lý danh mục sản phẩm",
      path: "/admin/categories",
      color: "#ff9800",
      buttonColor: "#ff9800",
    },
    {
      title: "Quản lý đơn hàng",
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      description: "Xem và cập nhật trạng thái đơn hàng",
      path: "/admin/orders",
      color: "#f44336",
      buttonColor: "#f44336",
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5", pt: 2, pb: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
          Bảng điều khiển
        </Typography>

        <Grid container spacing={3}>
          {/* Quản lý người dùng */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center", py: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: "#2196f3" }} />
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  Quản lý người dùng
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Xem và quản lý tài khoản người dùng
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/admin/users")}
                  sx={{
                    bgcolor: "#2196f3",
                    "&:hover": { bgcolor: "#1976d2" },
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Truy cập
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Quản lý sản phẩm */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center", py: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <ShoppingCartIcon sx={{ fontSize: 40, color: "#4caf50" }} />
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  Quản lý sản phẩm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thêm, sửa, xóa sản phẩm
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/admin/products")}
                  sx={{
                    bgcolor: "#4caf50",
                    "&:hover": { bgcolor: "#388e3c" },
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Truy cập
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Quản lý danh mục */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center", py: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <CategoryIcon sx={{ fontSize: 40, color: "#ff9800" }} />
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  Quản lý danh mục
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quản lý danh mục sản phẩm
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/admin/categories")}
                  sx={{
                    bgcolor: "#ff9800",
                    "&:hover": { bgcolor: "#f57c00" },
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Truy cập
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Quản lý thương hiệu */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center", py: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <LocalOfferIcon sx={{ fontSize: 40, color: "#9c27b0" }} />
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  Quản lý thương hiệu
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quản lý thương hiệu sản phẩm
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/admin/brands")}
                  sx={{
                    bgcolor: "#9c27b0",
                    "&:hover": { bgcolor: "#7b1fa2" },
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Truy cập
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Quản lý đơn hàng */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center", py: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <AssignmentIcon sx={{ fontSize: 40, color: "#f44336" }} />
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  Quản lý đơn hàng
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Xem và cập nhật trạng thái đơn hàng
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/admin/orders")}
                  sx={{
                    bgcolor: "#f44336",
                    "&:hover": { bgcolor: "#d32f2f" },
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Truy cập
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Quản lý mã giảm giá */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center", py: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <CardGiftcardIcon sx={{ fontSize: 40, color: "#9c27b0" }} />
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  Quản lý mã giảm giá
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tạo và quản lý mã giảm giá
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/admin/coupons")}
                  sx={{
                    bgcolor: "#9c27b0",
                    "&:hover": { bgcolor: "#7b1fa2" },
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Truy cập
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Quản lý mã giảm giá phí vận chuyển */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center", py: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <LocalShippingIcon sx={{ fontSize: 40, color: "#00bcd4" }} />
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  Quản lý mã giảm giá phí vận chuyển
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tạo và quản lý mã giảm giá cho phí vận chuyển
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/admin/shipping-coupons")}
                  sx={{
                    bgcolor: "#00bcd4",
                    "&:hover": { bgcolor: "#008ba3" },
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Truy cập
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
