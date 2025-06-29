import React from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();

  // Variants cho animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.3
      }
    }
  };

  // Variants cho các phần tử con
  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)', // Trừ đi chiều cao của navbar
        width: '100%',
        backgroundImage: `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1470&auto=format&fit=crop')`, // Ảnh mẫu đẹp từ Unsplash
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Overlay tối để text dễ đọc
        }
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          py: 8,
        }}
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 700,
              mb: 4,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            Chào mừng đến với Shop
          </Typography>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              mb: 6,
              maxWidth: 800,
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            Khám phá các sản phẩm tuyệt vời của chúng tôi
          </Typography>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 600 }}
              onClick={() => navigate('/products')}
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Mua sắm ngay
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1.1rem', 
                fontWeight: 600, 
                color: 'white', 
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onClick={() => navigate('/categories')}
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Xem danh mục
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Home; 