import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Button,
  Alert,
  Grid,
  Paper,
  Divider,
  Chip,
  IconButton,
  TextField,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
} from "@mui/material";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext"; // Import the CartContext
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from "@mui/icons-material";
import axios from "axios";
import ReviewList from "../../components/ReviewList";
import ReviewForm from "../../components/ReviewForm";
import { motion } from "framer-motion";
import styles from "./ProductDetail.module.css";

const API_URL = process.env.REACT_APP_API_URL;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart(); // Get cart state and addToCart function from context
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const autoPlayRef = useRef();

  useEffect(() => {
    // Fetch brands and categories song song
    const fetchBrandsAndCategories = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/api/brands`),
          axios.get(`${API_URL}/api/categories`),
        ]);
        setBrands(brandsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        // ignore
      }
    };
    fetchBrandsAndCategories();
  }, []);

  const fetchProductDetails = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products/${id}`);
      console.log("Product details:", data);
      setProduct(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Lỗi khi tải chi tiết sản phẩm. Vui lòng thử lại sau.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  // Khi quay lại trang chi tiết sản phẩm, luôn fetch lại dữ liệu mới nhất
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Khi tab được focus lại, fetch lại sản phẩm
        fetchProductDetails();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  const getBrandName = (brandId) => {
    if (!brandId) return "Không có";
    const brand = brands.find((b) => b.id === brandId || b._id === brandId);
    return brand ? brand.name : brandId;
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return "Không có";
    const category = categories.find(
      (c) => c.id === categoryId || c._id === categoryId
    );
    return category ? category.name : categoryId;
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (product?.countInStock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity || 1,
        countInStock: stock,
      });
      navigate("/cart");
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleReviewSubmitted = () => {
    setRefreshReviews(!refreshReviews);
  };

  const handleBrandClick = () => {
    if (product?.brand) {
      navigate(`/products?brand=${product.brand}`);
    }
  };

  const handleCategoryClick = () => {
    if (product?.category) {
      navigate(`/products?category=${product.category}`);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 50 },
    },
  };

  const formatPrice = (price) => {
    return price ? price.toLocaleString("vi-VN") + "đ" : "";
  };

  // Xử lý tồn kho: nếu là chuỗi có dấu '-', lấy số đầu tiên, nếu không thì ép kiểu về số
  let stock = 0;
  if (typeof product?.countInStock === "string") {
    stock = Number(product.countInStock.split("-")[0]);
  } else {
    stock = Number(product?.countInStock);
  }

  const imagesArr =
    product?.images &&
    Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];

  // Hiệu ứng tự động chuyển slide
  useEffect(() => {
    if (imagesArr.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentImgIdx((prev) => (prev + 1) % imagesArr.length);
      }, 3500);
      return () => clearInterval(autoPlayRef.current);
    }
  }, [imagesArr.length]);

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: 4, mb: 8 }}
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Button
        component={Link}
        to="/products"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
        variant="text"
      >
        Quay lại danh sách sản phẩm
      </Button>

      <Grid container spacing={4}>
        <Grid
          item
          xs={12}
          md={6}
          component={motion.div}
          variants={itemVariants}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #eee",
              position: "relative",
              p: 0,
            }}
          >
            {imagesArr.length > 1 ? (
              <div className={styles.carouselContainer}>
                <button
                  className={`${styles.arrowBtn} ${styles.arrowLeft}`}
                  onClick={() =>
                    setCurrentImgIdx(
                      (prev) => (prev - 1 + imagesArr.length) % imagesArr.length
                    )
                  }
                  aria-label="Trước"
                >
                  <ArrowBackIosNewIcon fontSize="medium" />
                </button>
                <img
                  src={imagesArr[currentImgIdx]}
                  alt={product?.name}
                  className={`${styles.carouselImage} ${styles.carouselImageActive}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/600";
                  }}
                />
                <button
                  className={`${styles.arrowBtn} ${styles.arrowRight}`}
                  onClick={() =>
                    setCurrentImgIdx((prev) => (prev + 1) % imagesArr.length)
                  }
                  aria-label="Sau"
                >
                  <ArrowForwardIosIcon fontSize="medium" />
                </button>
                <div className={styles.dots}>
                  {imagesArr.map((img, idx) => (
                    <div
                      key={idx}
                      className={
                        idx === currentImgIdx
                          ? `${styles.dot} ${styles.dotActive}`
                          : styles.dot
                      }
                      onClick={() => setCurrentImgIdx(idx)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <img
                src={imagesArr[0]}
                alt={product?.name}
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "500px",
                  objectFit: "contain",
                  p: 2,
                  borderRadius: 12,
                  border: "3px solid #90caf9",
                  background: "#e3f2fd",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/600";
                }}
              />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box component={motion.div} variants={itemVariants}>
            <Typography variant="h4" component="h1" gutterBottom>
              {product?.name}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography
                variant="h5"
                color="primary"
                sx={{ fontWeight: "bold", mr: 1 }}
              >
                {formatPrice(product?.price)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({product?.numReviews || 0} đánh giá)
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="body1"
              paragraph
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {product?.description}
            </Typography>

            <Box sx={{ mt: 3, mb: 3 }}>
              <Chip
                label={stock > 0 ? "Còn hàng" : "Hết hàng"}
                color={stock > 0 ? "success" : "error"}
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Thương hiệu: ${getBrandName(product?.brand)}`}
                variant="outlined"
                sx={{ mr: 1, cursor: "pointer" }}
                onClick={handleBrandClick}
              />
              <Chip
                label={`Danh mục: ${getCategoryName(product?.category)}`}
                variant="outlined"
                sx={{ cursor: "pointer" }}
                onClick={handleCategoryClick}
              />
            </Box>

            {stock > 0 && (
              <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Số lượng:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #ddd",
                    borderRadius: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) handleQuantityChange(val);
                    }}
                    InputProps={{
                      inputProps: {
                        min: 1,
                        max: stock,
                        style: { textAlign: "center", width: "40px" },
                      },
                      disableUnderline: true,
                    }}
                    variant="standard"
                    sx={{ mx: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= stock}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handleAddToCart}
                disabled={stock <= 0}
                fullWidth
                sx={{ py: 1.5 }}
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {stock <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="product tabs"
            component={motion.div}
            variants={itemVariants}
          >
            <Tab label="Chi tiết sản phẩm" id="tab-0" />
            <Tab label={`Đánh giá (${product?.numReviews || 0})`} id="tab-1" />
          </Tabs>
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0">
          {activeTab === 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin chi tiết
                </Typography>
                <Typography variant="body1" paragraph>
                  {product?.description || "Không có thông tin chi tiết."}
                </Typography>

                {/* Hiển thị thêm thông tin khác nếu có */}
                {product?.specifications && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Thông số kỹ thuật
                    </Typography>
                    <pre>{product.specifications}</pre>
                  </Box>
                )}
              </Paper>
            </motion.div>
          )}
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1">
          {activeTab === 1 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <ReviewForm
                productId={id}
                onReviewSubmitted={handleReviewSubmitted}
              />
              <ReviewList
                productId={id}
                key={refreshReviews ? "refresh" : "initial"}
              />
            </motion.div>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ProductDetail;
