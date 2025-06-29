import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  InputBase,
  alpha,
  styled,
  Button,
  Link,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  ShoppingCartOutlined as ShoppingCartIcon,
  AccountCircleOutlined as AccountCircleIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Category as CategoryIcon,
  Storefront as StorefrontIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useSearch } from "../context/SearchContext";

// --- Styled Components for a modern look ---

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: "linear-gradient(45deg, #e3f2fd 30%, #ede7f6 90%)", // Light blue to light purple
  color: "black",
}));

const Search = styled("form")(({ theme }) => ({
  position: "relative",
  borderRadius: "50px",
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.black, 0.1),
  },
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1.2, 1.2, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("md")]: {
      width: "35ch",
    },
  },
}));

const NavLink = styled(Link)(({ theme }) => ({
  textDecoration: "none",
  color: alpha(theme.palette.common.black, 0.7),
  fontWeight: 500,
  padding: theme.spacing(1, 2),
  borderRadius: "8px",
  transition: "background-color 0.3s, color 0.3s",
  "&:hover": {
    color: theme.palette.common.black,
    backgroundColor: alpha(theme.palette.common.black, 0.05),
  },
}));

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { cart } = useCart();
  const { searchTerm: searchContextTerm, setSearchTerm } = useSearch();

  // Đồng bộ searchTerm với keyword trên URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get("keyword") || "";
    setSearchTerm(keyword);
  }, [location]);

  // Debounce searchTerm để tự động navigate khi nhập
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchContextTerm.trim() === "") {
        navigate("/products");
        return;
      }
      navigate(`/products?keyword=${searchContextTerm.trim()}`);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchContextTerm, navigate]);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate("/");
  };

  // Không reset searchTerm khi submit
  const handleSearch = (e) => {
    e.preventDefault();
    // Không cần navigate ở đây nữa vì đã realtime ở useEffect
  };

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      open={isMenuOpen}
      onClose={handleMenuClose}
      onClick={handleMenuClose}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: "visible",
          filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
          mt: 1.5,
          "& .MuiAvatar-root": {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
        },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      {currentUser.isAdmin && (
        <MenuItem component={RouterLink} to="/admin/dashboard">
          <DashboardIcon sx={{ mr: 1.5 }} /> Dashboard
        </MenuItem>
      )}
      <MenuItem component={RouterLink} to="/profile">
        <AccountCircleIcon sx={{ mr: 1.5 }} /> Hồ sơ
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <LogoutIcon sx={{ mr: 1.5 }} /> Đăng xuất
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <StyledAppBar position="sticky">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: "bold",
              textDecoration: "none",
              color: "inherit",
              letterSpacing: "1px",
            }}
          >
            S-SHOP
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              gap: 2,
            }}
          >
            <NavLink component={RouterLink} to="/products">
              <StorefrontIcon sx={{ mr: 0.5, fontSize: "1.2rem" }} />
              Sản phẩm
            </NavLink>
            <NavLink component={RouterLink} to="/categories">
              <CategoryIcon sx={{ mr: 0.5, fontSize: "1.2rem" }} />
              Danh mục
            </NavLink>
            <NavLink component={RouterLink} to="/orders">
              <HistoryIcon sx={{ mr: 0.5, fontSize: "1.2rem" }} />
              Lịch sử
            </NavLink>
          </Box>

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Search onSubmit={handleSearch}>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Tìm kiếm…"
                value={searchContextTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Search>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
            <IconButton
              component={RouterLink}
              to="/cart"
              size="large"
              color="inherit"
            >
              <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            {currentUser ? (
              <IconButton
                size="large"
                edge="end"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <AccountCircleIcon />
              </IconButton>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                variant="text"
                sx={{ ml: 1, color: "inherit" }}
              >
                Đăng nhập
              </Button>
            )}
          </Box>
        </Toolbar>
      </StyledAppBar>
      {currentUser && renderMenu}
    </>
  );
};

export default Header;
