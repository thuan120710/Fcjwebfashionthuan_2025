import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import "./SearchPage.css";

// Components
import ProductCard from "../components/ProductCard";

// Thêm hàm chuẩn hóa tiếng Việt không dấu
function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

const SearchPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    price: "",
    rating: "",
    sort: "newest",
  });

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Gọi API backend đúng domain và endpoint
        let url = `${API_URL}/api/products?keyword=${keyword}`;
        if (category) url += `&category=${category}`;
        const response = await fetch(url);
        const data = await response.json();
        setProducts(data.products || []);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch products");
        setLoading(false);
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, [keyword, category, API_URL]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>
          {keyword ? `Search results for "${keyword}"` : "All Products"}
          {category && ` in ${category}`}
        </h1>
        <p>{products.length} products found</p>
      </div>

      <div className="search-container">
        <div className="filter-sidebar">
          <div className="filter-section">
            <h3>Filters</h3>

            <div className="filter-group">
              <label>Price Range</label>
              <select
                name="price"
                value={filters.price}
                onChange={handleFilterChange}
              >
                <option value="">All Prices</option>
                <option value="0-50">Under $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="200-500">$200 - $500</option>
                <option value="500-">$500 & Above</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Rating</label>
              <select
                name="rating"
                value={filters.rating}
                onChange={handleFilterChange}
              >
                <option value="">All Ratings</option>
                <option value="4">4★ & Above</option>
                <option value="3">3★ & Above</option>
                <option value="2">2★ & Above</option>
                <option value="1">1★ & Above</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="search-results">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : products.length === 0 ? (
            <div className="no-results">
              <p>No products found matching your criteria.</p>
              <Link to="/" className="back-to-home">
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
