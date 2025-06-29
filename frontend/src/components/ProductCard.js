import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Box, Rating, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import './ProductCard.css';

const ProductCard = ({ product, index }) => {
  // Tính toán độ trễ dựa trên index, để các sản phẩm hiện ra theo thứ tự
  const delay = index * 0.1;

  // Format price with VND currency
  const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="product-card" 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
          <CardMedia
            component="img"
            height="200"
            image={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300'}
            alt={product.name}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent sx={{ flexGrow: 1, p: 2 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 500, 
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                height: '3rem'
              }}
            >
              {product.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating value={product.rating || 0} precision={0.5} size="small" readOnly />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({product.numReviews || 0})
              </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Chip 
                label={product?.brand?.name || 'Không có'} 
                size="small" 
                variant="outlined" 
                sx={{ mr: 0.5, mb: 0.5 }}
              />
              <Chip 
                label={product?.category?.name || 'Không có'} 
                size="small" 
                variant="outlined" 
                sx={{ mb: 0.5 }}
              />
            </Box>
            
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              {formatPrice(product.price)}
            </Typography>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
};

export default ProductCard;