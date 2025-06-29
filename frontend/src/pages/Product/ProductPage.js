import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "./ProductPage.css";
import ReviewList from "./ReviewList";
import ReviewForm from "./ReviewForm";

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const autoPlayRef = useRef();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call to the backend
        // For now, we'll use mock data
        const mockProducts = [
          {
            _id: "1",
            name: "Wireless Headphones",
            image: "https://via.placeholder.com/600",
            description:
              "High-quality wireless headphones with noise cancellation. Experience crystal-clear sound and comfort for hours. Features include Bluetooth 5.0, 30-hour battery life, and premium materials for durability and style.",
            brand: "AudioTech",
            category: "electronics",
            price: 99.99,
            countInStock: 10,
            rating: 4.5,
            numReviews: 12,
          },
          {
            _id: "2",
            name: "Smartphone X",
            image: "https://via.placeholder.com/600",
            description:
              "Latest smartphone with advanced features including a high-resolution camera, fast processor, and all-day battery life. The 6.5-inch OLED display provides vibrant colors and sharp details for an immersive viewing experience.",
            brand: "TechGiant",
            category: "electronics",
            price: 699.99,
            countInStock: 7,
            rating: 4.0,
            numReviews: 8,
          },
          {
            _id: "3",
            name: "Cotton T-Shirt",
            image: "https://via.placeholder.com/600",
            description:
              "Comfortable cotton t-shirt for everyday wear. Made from 100% organic cotton that is soft on your skin and environmentally friendly. Available in multiple colors and sizes.",
            brand: "FashionBrand",
            category: "clothing",
            price: 19.99,
            countInStock: 20,
            rating: 4.2,
            numReviews: 5,
          },
          {
            _id: "4",
            name: "Coffee Maker",
            image: "https://via.placeholder.com/600",
            description:
              "Automatic coffee maker for the perfect brew every time. Features programmable settings, a thermal carafe to keep your coffee hot for hours, and an easy-to-use interface for a hassle-free morning routine.",
            brand: "HomeAppliances",
            category: "home",
            price: 79.99,
            countInStock: 5,
            rating: 4.7,
            numReviews: 10,
          },
          {
            _id: "5",
            name: "Novel: The Adventure",
            image: "https://via.placeholder.com/600",
            description:
              "Bestselling novel about an epic adventure that will take you on a journey through fantastical worlds and introduce you to unforgettable characters. A must-read for fantasy lovers.",
            brand: "BookPublisher",
            category: "books",
            price: 14.99,
            countInStock: 15,
            rating: 4.8,
            numReviews: 20,
          },
          {
            _id: "6",
            name: "Fitness Tracker",
            image: "https://via.placeholder.com/600",
            description:
              "Track your fitness goals with this smart device that monitors your heart rate, steps, sleep, and more. Sync with the mobile app to view detailed analytics and set personalized fitness goals.",
            brand: "FitTech",
            category: "electronics",
            price: 49.99,
            countInStock: 8,
            rating: 4.3,
            numReviews: 15,
          },
        ];

        const foundProduct = mockProducts.find((p) => p._id === id);

        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError("Product not found");
        }

        setLoading(false);
      } catch (error) {
        setError("Failed to fetch product details");
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.images && product.images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentImgIdx((prev) => (prev + 1) % product.images.length);
      }, 3500);
      return () => clearInterval(autoPlayRef.current);
    }
  }, [product]);

  // Function to render star ratings
  const renderRating = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="stars">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star filled">
            ★
          </span>
        ))}
        {halfStar && <span className="star filled">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star">
            ☆
          </span>
        ))}
      </div>
    );
  };

  const handleAddToCart = () => {
    // In a real app, this would dispatch an action to add the item to cart
    // For now, we'll just log to console
    console.log(`Added ${quantity} of ${product.name} to cart`);
    alert(`Added ${quantity} of ${product.name} to cart`);
  };

  // Function to handle editing a review
  const handleEditReview = (review) => {
    setReviewToEdit(review);
  };

  return (
    <div className="product-page">
      <div className="container">
        <div className="back-button">
          <Link to="/">← Back to Products</Link>
        </div>

        {loading ? (
          <div className="loader">Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : product ? (
          <div className="product-container">
            <div className="product-details">
              <div className="product-image-container">
                {product.images && product.images.length > 1 ? (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      maxWidth: 420,
                    }}
                    onMouseEnter={() =>
                      autoPlayRef.current && clearInterval(autoPlayRef.current)
                    }
                    onMouseLeave={() => {
                      if (product.images.length > 1 && !autoPlayRef.current) {
                        autoPlayRef.current = setInterval(() => {
                          setCurrentImgIdx(
                            (prev) => (prev + 1) % product.images.length
                          );
                        }, 3500);
                      }
                    }}
                  >
                    <img
                      src={product.images[currentImgIdx]}
                      alt={product.name}
                      className="product-detail-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/420";
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: 10,
                      }}
                    >
                      {product.images.map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            background:
                              idx === currentImgIdx
                                ? "linear-gradient(135deg, #1976d2 0%, #e91e63 100%)"
                                : "#bdbdbd",
                            border: "2px solid #fff",
                            boxShadow:
                              idx === currentImgIdx
                                ? "0 2px 8px rgba(233,30,99,0.18)"
                                : "0 1px 4px rgba(25,118,210,0.10)",
                            transform:
                              idx === currentImgIdx ? "scale(1.2)" : "scale(1)",
                            transition: "all 0.3s",
                            cursor: "pointer",
                            margin: "0 2px",
                          }}
                          onClick={() => setCurrentImgIdx(idx)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <img
                    src={
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : product.image
                    }
                    alt={product.name}
                    className="product-detail-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/420";
                    }}
                  />
                )}
              </div>

              <div className="product-info-container">
                <h1 className="product-detail-name">{product.name}</h1>

                <div className="product-detail-rating">
                  {renderRating(product.rating)}
                  <span className="reviews">{product.numReviews} reviews</span>
                </div>

                <div className="product-detail-price">
                  ${product.price.toFixed(2)}
                </div>

                <div className="product-detail-description">
                  <h3>Description:</h3>
                  <p>{product.description}</p>
                </div>

                <div className="product-detail-actions">
                  <div className="stock-status">
                    Status:
                    <span
                      className={
                        product.countInStock > 0 ? "in-stock" : "out-of-stock"
                      }
                    >
                      {product.countInStock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  {product.countInStock > 0 && (
                    <>
                      <div className="quantity-selector">
                        <label htmlFor="quantity">Quantity:</label>
                        <select
                          id="quantity"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                        >
                          {[
                            ...Array(Math.min(product.countInStock, 10)).keys(),
                          ].map((x) => (
                            <option key={x + 1} value={x + 1}>
                              {x + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        className="add-to-cart-button"
                        onClick={handleAddToCart}
                      >
                        Add to Cart
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <ReviewList productId={id} onEditReview={handleEditReview} />

      {reviewToEdit && (
        <ReviewForm
          productId={id}
          reviewToEdit={reviewToEdit}
          onReviewSubmitted={() => setReviewToEdit(null)}
        />
      )}
    </div>
  );
};

export default ProductPage;
