// import React from 'react';
// import { usePayment } from '../context/PaymentContext';
// import { useCart } from '../context/CartContext';
// import { Button, CircularProgress, Alert } from '@mui/material';

// const VNPayPayment = ({ orderId }) => {
//   const { paymentStatus, initiateVNPayPayment } = usePayment();
//   const { cartTotal, clearCart } = useCart();

//   const handlePayment = async () => {
//     try {
//       const paymentUrl = await initiateVNPayPayment(cartTotal, orderId);
//       if (paymentUrl) {
//         clearCart();
//         window.location.href = paymentUrl;
//       }
//     } catch (error) {
//       console.error('Lỗi khi tạo thanh toán:', error);
//     }
//   };

//   if (paymentStatus.loading) {
//     return (
//       <div style={{ textAlign: 'center', padding: '20px' }}>
//         <CircularProgress />
//         <p>Đang xử lý thanh toán...</p>
//       </div>
//     );
//   }

//   if (paymentStatus.error) {
//     return (
//       <Alert severity="error" style={{ margin: '20px 0' }}>
//         {paymentStatus.error}
//       </Alert>
//     );
//   }

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>Thanh toán qua VNPay</h2>
//       <p>Tổng tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}</p>
//       <Button
//         variant="contained"
//         color="primary"
//         onClick={handlePayment}
//         disabled={paymentStatus.loading}
//       >
//         Thanh toán ngay
//       </Button>
//     </div>
//   );
// };

// export default VNPayPayment;