import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../utils/api';

interface Order {
  id: number;
  total_amount: number;
  delivery_date: string;
  status: string;
  delivery_time?: string;
  created_at: string;
}

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await ordersAPI.getAll();
        setOrders(res.data || []);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-vh-100 bg-light animate-fade pb-5">
      <nav className="glass-nav py-3 mb-4">
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <button onClick={() => navigate('/home')} className="btn btn-link text-dark p-0 me-3">
              <i className="bi bi-arrow-left fs-4"></i>
            </button>
            <h4 className="fw-800 mb-0">My Orders</h4>
          </div>
        </div>
      </nav>

      <div className="container px-4">
        <div className="premium-card p-4 p-md-5 bg-white animate-up">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bag-x text-muted display-4 mb-3 opacity-25"></i>
              <h5 className="fw-800 mb-2">No orders yet</h5>
              <p className="text-muted mb-4">Place your first order to see it here.</p>
              <button onClick={() => navigate('/home')} className="btn-premium px-4 py-2">
                Start Ordering
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-borderless align-middle">
                <thead className="bg-light text-muted small text-uppercase">
                  <tr>
                    <th className="rounded-start ps-3">Order ID</th>
                    <th>Placed On</th>
                    <th>Delivery Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th className="rounded-end pe-3 text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-bottom-sm">
                      <td className="ps-3 py-3 fw-700">#{order.id}</td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>{new Date(order.delivery_date).toLocaleDateString()}</td>
                      <td>{order.delivery_time || '-'}</td>
                      <td>
                        <span className="badge bg-light text-dark rounded-pill fw-600 px-3">
                          {order.status}
                        </span>
                      </td>
                      <td className="pe-3 text-end fw-800 text-primary">₹{order.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-600 { font-weight: 600; }
        .border-bottom-sm { border-bottom: 1px solid #f0f0f0; }
      `}</style>
    </div>
  );
};

export default MyOrders;

