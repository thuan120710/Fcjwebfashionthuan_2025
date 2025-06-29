import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Box,
} from "@mui/material";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const CategoryProductList = () => {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products?category=${id}`);
        setProducts(res.data);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    const fetchCategory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categories/${id}`);
        setCategoryName(res.data.name || "");
      } catch (err) {
        setCategoryName("");
      }
    };
    fetchProducts();
    fetchCategory();
  }, [id]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Sản phẩm thuộc danh mục: {categoryName}
      </Typography>
      <Grid container spacing={3}>
        {loading ? (
          Array.from(new Array(6)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={180} />
                  <Skeleton variant="text" height={32} width="80%" />
                  <Skeleton variant="text" height={24} width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : products.length === 0 ? (
          <Box width="100%" textAlign="center" mt={4}>
            <Typography>Không có sản phẩm nào trong danh mục này.</Typography>
          </Box>
        ) : (
          products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id || product._id}>
              <Card>
                <CardMedia
                  component="img"
                  height="180"
                  image={product.image}
                  alt={product.name}
                />
                <CardContent>
                  <Typography variant="h6">{product.name}</Typography>
                  <Typography color="text.secondary">
                    {product.price?.toLocaleString("vi-VN")}đ
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default CategoryProductList;
