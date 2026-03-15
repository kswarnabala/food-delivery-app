import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsAPI, ordersAPI } from '../utils/api';
import { useCart } from '../context/AppContext';

const Payment = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const amount = searchParams.get('amount');

  useEffect(() => {
    createPayment();
    fetchOrderInfo();
  }, []);

  const createPayment = async () => {
    try {
      if (!orderId || !amount) {
        console.error('Missing order ID or amount');
        return;
      }

      const response = await paymentsAPI.create({
        orderId: parseInt(orderId),
        amount: parseFloat(amount),
      });

      setPaymentData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to create payment:', error);
      setLoading(false);
    }
  };

  const fetchOrderInfo = async () => {
    try {
      if (!orderId) return;
      const res = await ordersAPI.getById(parseInt(orderId, 10));
      setOrderInfo(res.data.order);
    } catch (err) {
      console.error('Failed to load order info', err);
    }
  };

  const handlePaymentComplete = async () => {
    try {
      if (!paymentData?.payment?.id) {
        console.error('Payment ID not found');
        return;
      }

      await paymentsAPI.complete(paymentData.payment.id);
      setPaymentCompleted(true);
      clearCart();
    } catch (error) {
      console.error('Failed to complete payment:', error);
      alert('Failed to complete payment');
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light animate-fade">
        <div className="premium-card p-5 text-center bg-white animate-up shadow-sm">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-4 text-muted fw-700">Connecting to secure gateway...</p>
        </div>
      </div>
    );
  }

  if (paymentCompleted) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light animate-fade px-4">
        <div className="premium-card p-5 text-center bg-white animate-up shadow-lg" style={{ maxWidth: '520px' }}>
          <div className="mb-4">
            <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center animate-float shadow" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-check-lg fs-1"></i>
            </div>
          </div>
          <h1 className="fw-800 text-success mb-2">Order Confirmed! 🎉</h1>
          <p className="text-muted mb-3 fs-5">Your order <span className="text-dark fw-700">#{orderId}</span> is being prepared with love.</p>

          <div className="bg-light p-4 rounded-4 mb-4" style={{ border: '1px dashed #DDD' }}>
            <p className="mb-2 text-muted small text-uppercase fw-700">Estimated Delivery</p>
            {orderInfo ? (
              <>
                <p className="fw-800 fs-5 text-primary mb-1">
                  <i className="bi bi-calendar-event me-2"></i>
                  {new Date(orderInfo.delivery_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {orderInfo.delivery_time && (
                  <p className="fw-700 text-dark mb-0">
                    <i className="bi bi-clock me-2"></i>at {orderInfo.delivery_time}
                  </p>
                )}
              </>
            ) : (
              <p className="fw-700 text-dark mb-0">Your food will be delivered soon!</p>
            )}
            <p className="small text-muted mt-2 mb-0">
              Your food will be delivered within 2 days from the order date at the time you selected.
            </p>
          </div>

          <div className="d-grid gap-2">
            <button
              onClick={() => navigate('/my-orders')}
              className="btn-premium w-100 py-3 fs-5"
            >
              <i className="bi bi-bag-check me-2"></i>View My Orders
            </button>
            <button
              onClick={() => navigate('/home')}
              className="btn btn-outline-primary w-100 py-3 fs-5 fw-700 rounded-pill"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light animate-fade pb-5">
      <nav className="glass-nav py-3 mb-5 shadow-sm bg-white">
        <div className="container d-flex align-items-center">
          <button onClick={() => navigate('/order')} className="btn btn-link text-dark p-0 me-3">
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <h4 className="fw-800 mb-0">Secure Checkout</h4>
        </div>
      </nav>

      <div className="container px-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            {/* Amount Summary */}
            <div className="premium-card p-4 p-md-5 mb-4 text-center bg-white animate-up shadow-sm border-0">
              <span className="text-muted small fw-700 text-uppercase tracking-wider">Total Amount to Pay</span>
              <h1 className="display-4 fw-800 text-primary mt-2 mb-1">₹{amount}</h1>
              <p className="text-muted mb-1 small opacity-75">Order ID: #{orderId}</p>
              {orderInfo && (
                <p className="text-muted mb-0 small">
                  Delivering on {new Date(orderInfo.delivery_date).toLocaleDateString()}
                  {orderInfo.delivery_time && ` at ${orderInfo.delivery_time}`}
                </p>
              )}
            </div>

            {/* QR Code Section */}
            <div className="premium-card p-4 p-md-5 text-center bg-white animate-up shadow-sm border-0" style={{ animationDelay: '0.1s' }}>
              <h5 className="fw-800 mb-4">Scan QR to Pay</h5>

              {paymentData?.qrCode ? (
                <div>
                  <div className="p-3 bg-light rounded-4 d-inline-block shadow-sm mb-4" style={{ border: '2px solid #FF523B' }}>
                    <img
                      src={paymentData.qrCode}
                      alt="Payment QR Code"
                      className="img-fluid rounded-3"
                      style={{ maxWidth: '240px' }}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-muted small mb-4 px-3">Scan with any UPI app (GPay, PhonePe, Paytm)</p>
                    <div className="d-flex align-items-center justify-content-center gap-3 mb-4 opacity-50">
                      <i className="bi bi-shield-lock-fill fs-4 text-success"></i>
                      <span className="small fw-600">Secure UPI Interface</span>
                    </div>
                    <button
                      onClick={handlePaymentComplete}
                      className="btn-premium w-100 py-3 fs-5 shadow-lg"
                      style={{ background: '#28A745', border: 'none' }}
                    >
                      I have completed payment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-5">
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <p className="text-muted">Initializing QR interface...</p>
                </div>
              )}
            </div>

            <div className="text-center mt-4">
              <p className="text-muted small">
                <i className="bi bi-lock-fill me-1"></i> SSL Encrypted & Secure
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .tracking-wider { letter-spacing: 1px; }
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-600 { font-weight: 600; }
        .glass-nav {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.9);
          position: sticky;
          top: 0;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
};

export default Payment;
