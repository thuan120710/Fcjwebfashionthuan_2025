import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './OrderPage.css';

const OrderPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call to fetch order details
        // For now, we'll use mock data
        setTimeout(() => {
          const mockOrder = {
            _id: id,
            user: {
              name: 'John Doe',
              email: 'john@example.com'
            },
            orderItems: [
              {
                _id: '1',
                name: 'Wireless Headphones',
                image: 'https://via.placeholder.com/100',
                price: 99.99,
                qty: 1,
                product: '1'
              },
              {
                _id: '2',
                name: 'Phone Case',
                image: 'https://via.placeholder.com/100',
                price: 29.99,
                qty: 1,
                product: '2'
              }
            ],
            shippingAddress: {
              address: '123 Main St',
              city: 'Boston',
              postalCode: '02108',
              country: 'USA'
            },
            paymentMethod: 'Credit Card',
            paymentResult: {
              id: 'pi_123456789',
              status: 'succeeded',
              update_time: '2023-06-15T10:35:00Z',
              email_address: 'john@example.com'
            },
            itemsPrice: 129.98,
            taxPrice: 13.00,
            shippingPrice: 10.00,
            totalPrice: 152.98,
            isPaid: true,
            paidAt: '2023-06-15T10:35:00Z',
            isDelivered: true,
            deliveredAt: '2023-06-18T14:20:00Z',
            createdAt: '2023-06-15T10:30:00Z'
          };
          
          setOrder(mockOrder);
          setLoading(false);
        }, 1000); // Simulate network delay
      } catch (error) {
        setError('Failed to fetch order details');
        setLoading(false);
        console.error('Error fetching order:', error);
      }
    };
    
    fetchOrder();
  }, [id]);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="order-page">
      <div className="back-button">
        <Link to="/profile">
          <i className="fas fa-arrow-left"></i> Back to Profile
        </Link>
      </div>
      
      {loading ? (
        <div className="loading">Loading order details...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="order-container">
          <h1>Order #{order._id}</h1>
          <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
          
          <div className="order-grid">
            <div className="order-details-container">
              <div className="order-section">
                <h2>Shipping</h2>
                <p><strong>Name:</strong> {order.user.name}</p>
                <p><strong>Email:</strong> {order.user.email}</p>
                <p><strong>Address:</strong> {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                <div className="delivery-status">
                  {order.isDelivered ? (
                    <div className="status-success">Delivered on {formatDate(order.deliveredAt)}</div>
                  ) : (
                    <div className="status-pending">Not Delivered</div>
                  )}
                </div>
              </div>
              
              <div className="order-section">
                <h2>Payment</h2>
                <p><strong>Method:</strong> {order.paymentMethod}</p>
                <div className="payment-status">
                  {order.isPaid ? (
                    <div className="status-success">Paid on {formatDate(order.paidAt)}</div>
                  ) : (
                    <div className="status-pending">Not Paid</div>
                  )}
                </div>
              </div>
              
              <div className="order-section">
                <h2>Order Items</h2>
                <div className="order-items">
                  {order.orderItems.map((item) => (
                    <div key={item._id} className="order-item">
                      <div className="item-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="item-details">
                        <Link to={`/product/${item.product}`} className="item-name">
                          {item.name}
                        </Link>
                      </div>
                      <div className="item-quantity">
                        {item.qty} x ${item.price.toFixed(2)}
                      </div>
                      <div className="item-total">
                        ${(item.qty * item.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="order-summary-container">
              <div className="order-summary">
                <h2>Order Summary</h2>
                
                <div className="summary-row">
                  <span>Items</span>
                  <span>${order.itemsPrice.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>${order.shippingPrice.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Tax</span>
                  <span>${order.taxPrice.toFixed(2)}</span>
                </div>
                
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${order.totalPrice.toFixed(2)}</span>
                </div>
                
                {!order.isPaid && (
                  <button className="pay-now-btn">Pay Now</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;