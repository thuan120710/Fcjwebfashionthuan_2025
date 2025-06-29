import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [paymentStatus, setPaymentStatus] = useState({
    loading: false,
    error: null,
    success: false
  });

  const [paymentUrl, setPaymentUrl] = useState(null);

  const initiateVNPayPayment = async (amount, orderId) => {
    try {
      setPaymentStatus({ loading: true, error: null, success: false });
      const response = await axios.post('/api/payment/create-vnpay-url', {
        amount,
        orderId
      });
      setPaymentUrl(response.data.paymentUrl);
      setPaymentStatus({ loading: false, error: null, success: true });
      return response.data.paymentUrl;
    } catch (error) {
      setPaymentStatus({
        loading: false,
        error: error.response?.data?.message || 'Lỗi khi tạo URL thanh toán',
        success: false
      });
      throw error;
    }
  };

  const verifyPayment = async (queryParams) => {
    try {
      setPaymentStatus({ loading: true, error: null, success: false });
      const response = await axios.get('/api/payment/verify-payment', {
        params: queryParams
      });
      setPaymentStatus({ loading: false, error: null, success: true });
      return response.data;
    } catch (error) {
      setPaymentStatus({
        loading: false,
        error: error.response?.data?.message || 'Lỗi khi xác thực thanh toán',
        success: false
      });
      throw error;
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        paymentStatus,
        paymentUrl,
        initiateVNPayPayment,
        verifyPayment
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};