import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ordersAPI } from '../utils/api';
import { addDays, format } from 'date-fns';

const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      ordersAPI.getById(parseInt(orderId, 10))
        .then(res => setOrderInfo(res.data.order))
        .catch(err => console.error('Failed to load order info', err));
    }
  }, [orderId]);

  const deliveryDate = orderInfo?.delivery_date
    ? format(new Date(orderInfo.delivery_date), 'EEEE, MMMM dd, yyyy')
    : format(addDays(new Date(), 2), 'EEEE, MMMM dd, yyyy');

  const deliveryTime = orderInfo?.delivery_time || '';

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light animate-fade px-4">
      <div className="premium-card p-5 text-center bg-white animate-up shadow-lg" style={{ maxWidth: '520px' }}>
        <div className="mb-4">
          <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center animate-float shadow" style={{ width: '80px', height: '80px' }}>
            <i className="bi bi-check-lg fs-1"></i>
          </div>
        </div>
        <h1 className="fw-800 text-success mb-2">Order Placed Successfully! 🎉</h1>
        {orderId && (
          <p className="text-muted mb-3 fs-5">Order <span className="text-dark fw-700">#{orderId}</span></p>
        )}

        <div className="bg-light p-4 rounded-4 mb-4" style={{ border: '1px dashed #DDD' }}>
          <p className="mb-2 text-muted small text-uppercase fw-700">Estimated Delivery</p>
          <p className="fw-800 fs-5 text-primary mb-1">
            <i className="bi bi-calendar-event me-2"></i>{deliveryDate}
          </p>
          {deliveryTime && (
            <p className="fw-700 text-dark mb-0">
              <i className="bi bi-clock me-2"></i>at {deliveryTime}
            </p>
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

      <style>{`
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
      `}</style>
    </div>
  );
};

export default OrderSuccess;
