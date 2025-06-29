import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./Categories.module.css";

const API_URL = process.env.REACT_APP_API_URL;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/categories`);
        setCategories(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className={styles.categoriesBg}>
      <div className={styles.categoriesTitle}>Danh mục sản phẩm</div>
      <div className={styles.categoryGrid}>
        {loading
          ? Array.from(new Array(6)).map((_, index) => (
              <div className={styles.categoryCard} key={index}>
                <div className={styles.categoryName}>
                  <span style={{ opacity: 0.5 }}>Đang tải...</span>
                </div>
                <div className={styles.categoryDesc}>
                  <span style={{ opacity: 0.3 }}>Đang tải...</span>
                </div>
              </div>
            ))
          : categories.map((category) => (
              <div
                className={styles.categoryCard}
                key={category.id || category._id}
                onClick={() =>
                  navigate(`/products?category=${category.id || category._id}`)
                }
              >
                <div className={styles.categoryName}>{category.name}</div>
                <div className={styles.categoryDesc}>
                  {category.description || "Không có mô tả"}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default Categories;
