import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  Alert,
  Pagination,
} from "@mui/material";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Import Link và useLocation để sử dụng cho việc điều hướng và lấy query param
import { useCart } from "../../context/CartContext";
import styles from "./ProductList.module.css";
import { useSearch } from "../../context/SearchContext";

const API_URL = process.env.REACT_APP_API_URL;

// Helper functions
const getBrandName = (brandId, brands = []) => {
  if (!brandId) return "Không có";
  const brand = brands.find((b) => b.id === brandId || b._id === brandId);
  return brand ? brand.name : brandId;
};

const getCategoryName = (categoryId, categories = []) => {
  if (!categoryId) return "Không có";
  const category = categories.find(
    (c) => c.id === categoryId || c._id === categoryId
  );
  return category ? category.name : categoryId;
};

function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const location = useLocation();
  const { cart, addToCart } = useCart();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const brandId = params.get("brand");
  const keyword = params.get("keyword") || params.get("search") || "";
  // State lưu index ảnh cho từng sản phẩm
  const [imgIndexes, setImgIndexes] = useState({});
  const intervalRefs = useRef({});
  const { searchTerm } = useSearch();

  const handlePageChange = (event, value) => {
    setPageNumber(value); // sẽ trigger useEffect gọi lại API backend
  };

  // Lấy dữ liệu sản phẩm từ backend
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let url = `${API_URL}/api/products?`;
      url += `pageNumber=${pageNumber}`;
      if (categoryId) url += `&category=${categoryId}`;
      if (brandId) url += `&brand=${brandId}`;
      if (keyword) url += `&keyword=${keyword}`;
      try {
        const { data } = await axios.get(url);
        console.log("Products data:", data);
        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
        setTotalProducts(data.totalProducts);
      } catch (error) {
        setError("Lỗi khi tải sản phẩm. Vui lòng thử lại sau.");
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchTerm, pageNumber, categoryId, brandId, keyword]);

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

  // Auto-play slide cho từng sản phẩm
  useEffect(() => {
    products.forEach((product) => {
      const imagesArr =
        Array.isArray(product.images) && product.images.length > 0
          ? product.images
          : product.image
          ? [product.image]
          : [];
      if (imagesArr.length > 1 && !intervalRefs.current[product.id]) {
        intervalRefs.current[product.id] = setInterval(() => {
          setImgIndexes((prev) => ({
            ...prev,
            [product.id]: ((prev[product.id] || 0) + 1) % imagesArr.length,
          }));
        }, 2500);
      }
    });
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
      intervalRefs.current = {};
    };
  }, [products]);

  const handleBuyNow = (product) => {
    if (product && product.countInStock > 0) {
      // Nếu sản phẩm chưa có trong giỏ hàng, thêm vào với số lượng 1
      const itemInCart = cart.find((i) => i.productId === product.id);
      if (!itemInCart) {
        addToCart({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
          countInStock: product.countInStock,
        });
      }
      // Chuyển thẳng đến trang thanh toán
      navigate("/checkout");
    }
  };

  // Helper: lấy số lượng đã có trong giỏ hàng
  const getCartQuantity = (productId) => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Danh sách sản phẩm
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : products.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Không có sản phẩm nào được tìm thấy
        </Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {products.map((product) => {
              const cartQty = getCartQuantity(product.id);
              const leftStock = product.countInStock - cartQty;
              const inStock = leftStock > 0;
              const imagesArr =
                Array.isArray(product.images) && product.images.length > 0
                  ? product.images
                  : product.image
                  ? [product.image]
                  : [];
              const idx = imgIndexes[product.id] || 0;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card className={styles.card}>
                    <div
                      className={styles.slideContainer}
                      onMouseEnter={() => {
                        if (intervalRefs.current[product.id])
                          clearInterval(intervalRefs.current[product.id]);
                      }}
                      onMouseLeave={() => {
                        if (
                          imagesArr.length > 1 &&
                          !intervalRefs.current[product.id]
                        ) {
                          intervalRefs.current[product.id] = setInterval(() => {
                            setImgIndexes((prev) => ({
                              ...prev,
                              [product.id]:
                                ((prev[product.id] || 0) + 1) %
                                imagesArr.length,
                            }));
                          }, 2500);
                        }
                      }}
                    >
                      {imagesArr.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={product.name}
                          className={
                            i === idx
                              ? `${styles.slideImage} ${styles.slideImageActive}`
                              : styles.slideImage
                          }
                          style={{ zIndex: i === idx ? 2 : 1 }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/200";
                          }}
                        />
                      ))}
                      {imagesArr.length > 1 && (
                        <div className={styles.slideDots}>
                          {imagesArr.map((img, i) => (
                            <div
                              key={i}
                              className={
                                i === idx
                                  ? `${styles.dot} ${styles.dotActive}`
                                  : styles.dot
                              }
                              onClick={() =>
                                setImgIndexes((prev) => ({
                                  ...prev,
                                  [product.id]: i,
                                }))
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <CardContent>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          fontWeight: "bold",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          height: "3.2em",
                        }}
                      >
                        {product.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          mt: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          height: "2.9em",
                        }}
                      >
                        {product.description}
                      </Typography>
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Thương hiệu: {getBrandName(product.brand, brands)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Danh mục:{" "}
                          {getCategoryName(product.category, categories)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 2,
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                          {product.price.toLocaleString("vi-VN")}đ
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {inStock ? `${leftStock} in stock` : "Hết hàng"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Link
                          to={`/product/${product.id}`}
                          style={{ textDecoration: "none", flex: 1 }}
                        >
                          <Button
                            variant="outlined"
                            fullWidth
                            disabled={!inStock}
                            className={styles.actionBtn}
                            sx={{ border: "none" }}
                          >
                            Xem Chi Tiết
                          </Button>
                        </Link>
                        <Button
                          variant="contained"
                          sx={{ flex: 1 }}
                          fullWidth
                          disabled={!inStock}
                          onClick={() => handleBuyNow(product)}
                          className={styles.actionBtn}
                        >
                          Mua Ngay
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {pages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
                py: 2,
                borderRadius: 2,
                boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
                background: "#fff",
              }}
            >
              <Pagination
                count={pages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.08)",
                    },
                  },
                  "& .Mui-selected": {
                    fontWeight: "bold",
                    backgroundColor: "primary.dark",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "primary.main",
                    },
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductList;
