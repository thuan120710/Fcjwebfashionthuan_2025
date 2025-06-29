import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  Avatar,
  Rating,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const ReviewList = ({ productId, onEditReview }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve userInfo from local storage
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${API_URL}/api/reviews/product/${productId}`
        );
        setReviews(data);
        setError(null);
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : "Không thể tải đánh giá. Vui lòng thử lại sau."
        );
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handleDelete = async (reviewId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.delete(`${API_URL}/api/reviews/${reviewId}`, config);
      setReviews(reviews.filter((review) => review._id !== reviewId));
    } catch (error) {
      setError("Không thể xóa đánh giá. Vui lòng thử lại sau.");
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (reviews.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 2,
          borderRadius: 2,
          backgroundColor: "#f8f9fa",
          textAlign: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Sản phẩm này chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản
          phẩm!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Đánh giá của khách hàng ({reviews.length})
      </Typography>

      <Box sx={{ mb: 3 }}>
        <List sx={{ width: "100%" }}>
          {reviews.map((review) => (
            <motion.div key={review._id} variants={itemVariants}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  flexDirection: "column",
                  p: 0,
                  mb: 3,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    width: "100%",
                    borderRadius: 2,
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Avatar
                      src={
                        review.user && review.user.avatar
                          ? review.user.avatar
                          : ""
                      }
                      sx={{
                        bgcolor: "primary.main",
                        width: 40,
                        height: 40,
                        mr: 2,
                      }}
                    >
                      {review.user && review.user.firstName
                        ? review.user.firstName.charAt(0).toUpperCase()
                        : "?"}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {review.user
                          ? `${review.user.firstName || ""} ${
                              review.user.lastName || ""
                            }`
                          : "Người dùng ẩn danh"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {review.createdAt
                          ? format(new Date(review.createdAt), "dd MMMM yyyy", {
                              locale: vi,
                            })
                          : ""}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                    <Rating value={review.rating} precision={0.5} readOnly />
                    {review.title && (
                      <Typography
                        variant="subtitle2"
                        sx={{ ml: 1, fontWeight: "bold" }}
                      >
                        {review.title}
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                    {review.comment}
                  </Typography>

                  {review.user && review.user._id === userInfo._id && (
                    <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onEditReview(review)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleDelete(review._id)}
                      >
                        Xóa
                      </Button>
                    </Box>
                  )}
                </Paper>
              </ListItem>
            </motion.div>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default ReviewList;
