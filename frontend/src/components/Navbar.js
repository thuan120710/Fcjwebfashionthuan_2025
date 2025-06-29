import React, { useState, useEffect } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Container,
  Badge,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  Divider,
  InputBase,
  alpha,
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  AccountCircle as AccountIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  Home as HomeIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const { cart } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const menuOpen = Boolean(anchorEl);

  // Animation variants
  const logoVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const searchVariants = {
    hidden: { opacity: 0, width: 0 },
    visible: { opacity: 1, width: "250px", transition: { duration: 0.3 } },
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery.trim()}`);
      setSearchQuery("");
      setSearchVisible(false);
    }
  };

  const handleSearchClick = () => {
    setSearchVisible(!searchVisible);
  };

  const handleProfileClick = (event) => {
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

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      <AppBar
        position="fixed"
        color="primary"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              justifyContent: "space-between",
              padding: isMobile ? "0 8px" : "0 16px",
            }}
          >
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <motion.div
              variants={logoVariants}
              initial="hidden"
              animate="visible"
            >
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: 700,
                  fontSize: isMobile ? "1.2rem" : "1.5rem",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    backgroundColor: "secondary.main",
                    color: "white",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 1,
                    fontWeight: "bold",
                  }}
                >
                  S
                </Box>
                {!isMobile && "SHOP ONLINE"}
              </Typography>
            </motion.div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <motion.div
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Button
                    color="inherit"
                    component={Link}
                    to="/"
                    sx={{ mx: 1 }}
                  >
                    Trang chủ
                  </Button>
                </motion.div>
                <motion.div
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    color="inherit"
                    component={Link}
                    to="/products"
                    sx={{ mx: 1 }}
                  >
                    Sản phẩm
                  </Button>
                </motion.div>
                <motion.div
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    color="inherit"
                    component={Link}
                    to="/categories"
                    sx={{ mx: 1 }}
                  >
                    Danh mục
                  </Button>
                </motion.div>
                <motion.div
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    color="inherit"
                    component={Link}
                    to="/profile/orders/history"
                    sx={{ mx: 1 }}
                  >
                    Lịch sử đặt hàng
                  </Button>
                </motion.div>
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AnimatePresence>
                {searchVisible && (
                  <motion.div
                    variants={searchVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <Box
                      component="form"
                      onSubmit={handleSearchSubmit}
                      sx={{
                        position: "relative",
                        borderRadius: theme.shape.borderRadius,
                        backgroundColor: alpha(
                          theme.palette.common.white,
                          0.15
                        ),
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.common.white,
                            0.25
                          ),
                        },
                        marginRight: theme.spacing(2),
                        width: "100%",
                      }}
                    >
                      <InputBase
                        sx={{
                          color: "inherit",
                          padding: theme.spacing(1, 1, 1, 2),
                          transition: theme.transitions.create("width"),
                          width: "100%",
                        }}
                        placeholder="Tìm kiếm sản phẩm..."
                        inputProps={{ "aria-label": "search" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton color="inherit" onClick={handleSearchClick}>
                  <SearchIcon />
                </IconButton>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton color="inherit" component={Link} to="/cart">
                  <Badge badgeContent={getCartItemCount()} color="error">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
              </motion.div>

              {user ? (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Tooltip title="Tài khoản">
                    <IconButton
                      onClick={handleProfileClick}
                      size="small"
                      sx={{ ml: 1 }}
                      aria-controls={menuOpen ? "account-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={menuOpen ? "true" : undefined}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "secondary.main",
                          fontSize: "0.875rem",
                        }}
                        src={user.avatar || user.profileImage}
                        alt={user.firstName || user.email}
                      >
                        {!user.avatar && !user.profileImage && (
                          user.firstName
                            ? user.firstName.charAt(0)
                            : user.email.charAt(0).toUpperCase()
                        )}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    color="inherit"
                    component={Link}
                    to="/login"
                    startIcon={<LoginIcon />}
                    sx={{ display: isMobile ? "none" : "flex" }}
                  >
                    Đăng nhập
                  </Button>
                </motion.div>
              )}

              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/profile");
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Tài khoản
                </MenuItem>
                {user && user.isAdmin && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      navigate("/admin");
                    }}
                  >
                    <ListItemIcon>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Đăng xuất
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            top: ["56px", "64px"],
            height: "calc(100% - 56px)",
            "@media (min-width: 0px) and (orientation: landscape)": {
              top: "48px",
              height: "calc(100% - 48px)",
            },
            "@media (min-width: 600px)": {
              top: "64px",
              height: "calc(100% - 64px)",
            },
          },
        }}
      >
        <Box sx={{ overflow: "auto", mt: 2 }}>
          <List>
            <ListItem
              button
              component={Link}
              to="/"
              onClick={handleDrawerToggle}
            >
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Trang chủ" />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/products"
              onClick={handleDrawerToggle}
            >
              <ListItemIcon>
                <ShoppingCartIcon />
              </ListItemIcon>
              <ListItemText primary="Sản phẩm" />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/categories"
              onClick={handleDrawerToggle}
            >
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Danh mục" />
            </ListItem>
          </List>
          <Divider />
          <List>
            {!user ? (
              <ListItem
                button
                component={Link}
                to="/login"
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary="Đăng nhập" />
              </ListItem>
            ) : (
              <>
                <ListItem
                  button
                  component={Link}
                  to="/profile/orders/history"
                  onClick={handleDrawerToggle}
                >
                  <ListItemIcon>
                    <ShoppingCartIcon />
                  </ListItemIcon>
                  <ListItemText primary="Lịch sử đặt hàng" />
                </ListItem>
                <ListItem
                  button
                  component={Link}
                  to="/profile"
                  onClick={handleDrawerToggle}
                >
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tài khoản" />
                </ListItem>
                {user.isAdmin && (
                  <ListItem
                    button
                    component={Link}
                    to="/admin"
                    onClick={handleDrawerToggle}
                  >
                    <ListItemIcon>
                      <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItem>
                )}
                <ListItem
                  button
                  onClick={() => {
                    handleLogout();
                    handleDrawerToggle();
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Đăng xuất" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
