import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Rating,
  Paper,
  Alert,
  CircularProgress,
  Collapse,
  InputLabel,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const ReviewForm = ({ productId, onReviewSubmitted, reviewToEdit }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(reviewToEdit ? reviewToEdit.rating : 0);
  const [title, setTitle] = useState(reviewToEdit ? reviewToEdit.title : "");
  const [comment, setComment] = useState(
    reviewToEdit ? reviewToEdit.comment : ""
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(!!reviewToEdit);

  useEffect(() => {
    if (reviewToEdit) {
      setShowForm(true);
      setRating(reviewToEdit.rating);
      setTitle(reviewToEdit.title);
      setComment(reviewToEdit.comment);
    }
  }, [reviewToEdit]);

  const handleRatingChange = (event, newValue) => {
    setRating(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (rating === 0) {
      setError("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (comment.trim().length < 5) {
      setError("Nội dung đánh giá quá ngắn");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      if (reviewToEdit) {
        await axios.put(
          `${API_URL}/api/reviews/${reviewToEdit._id}`,
          { rating, title, comment },
          config
        );
        setSuccess("Đánh giá của bạn đã được cập nhật!");
      } else {
        await axios.post(
          `${API_URL}/api/reviews`,
          { productId, rating, title, comment },
          config
        );
        setSuccess("Đánh giá của bạn đã được gửi thành công!");
      }

      // Reset form
      setRating(0);
      setTitle("");
      setComment("");
      setShowForm(false);

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, height: 0, overflow: "hidden" },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  if (!user) {
    return (
      <Paper
        elevation={0}
        sx={{ p: 3, mt: 3, borderRadius: 2, backgroundColor: "#f8f9fa" }}
      >
        <Typography variant="body1" textAlign="center">
          Vui lòng{" "}
          <Button color="primary" href="/login">
            đăng nhập
          </Button>{" "}
          để đánh giá sản phẩm
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h6" gutterBottom>
        Đánh giá sản phẩm
      </Typography>

      {!showForm ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowForm(true)}
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Viết đánh giá
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 2, backgroundColor: "#f8f9fa" }}
            >
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <motion.div variants={itemVariants}>
                  <Box sx={{ mb: 3 }}>
                    <InputLabel sx={{ mb: 1 }}>Đánh giá</InputLabel>
                    <Rating
                      name="rating"
                      value={rating}
                      onChange={handleRatingChange}
                      size="large"
                      precision={1}
                      sx={{ fontSize: "2rem" }}
                    />
                  </Box>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <TextField
                    fullWidth
                    label="Tiêu đề đánh giá (không bắt buộc)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <TextField
                    fullWidth
                    label="Nội dung đánh giá"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    multiline
                    rows={4}
                    required
                    inputProps={{ minLength: 5 }}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      sx={{ minWidth: 120 }}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Gửi đánh giá"
                      )}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowForm(false);
                        setRating(0);
                        setTitle("");
                        setComment("");
                        setError("");
                      }}
                    >
                      Hủy
                    </Button>
                  </Box>
                </motion.div>
              </Box>
            </Paper>
          </motion.div>
        </AnimatePresence>
      )}

      <Collapse in={!!success}>
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      </Collapse>
    </Box>
  );
};

export default ReviewForm;
