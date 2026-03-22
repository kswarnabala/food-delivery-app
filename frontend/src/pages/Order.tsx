import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../context/AppContext';
import { ordersAPI } from '../utils/api';
import { addDays, format } from 'date-fns';

const Order = () => {
  const { cart, getTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const selectedDeliveryDate = localStorage.getItem('selectedDeliveryDate') || format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const storedDeliveryInfo = (() => {
    try {
      const raw = localStorage.getItem('deliveryInfo');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [formData, setFormData] = useState({
    name: storedDeliveryInfo?.name || user?.name || '',
    phone: storedDeliveryInfo?.phone || '',
    address: storedDeliveryInfo?.address || '',
    saveInfo: !!storedDeliveryInfo,
    preferredTime: storedDeliveryInfo?.preferredTime || '',
    description: storedDeliveryInfo?.description || [],
  });

  const foodPrefs = ['Biryani', 'Breakfast Combo', 'Lunch Combo', 'Dinner Combo'];

  if (user?.role === 'admin') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="premium-card p-5 text-center bg-white" style={{ maxWidth: '420px' }}>
          <i className="bi bi-shield-lock text-primary display-4 mb-3"></i>
          <h3 className="fw-800 mb-2">Admins cannot place orders</h3>
          <p className="text-muted mb-4">Please use a customer account to create an order.</p>
          <button onClick={() => navigate('/home')} className="btn-premium px-4 py-2">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && name === 'saveInfo') {
      setFormData({ ...formData, saveInfo: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePrefChange = (pref: string) => {
    const current = [...formData.description];
    if (current.includes(pref)) {
      setFormData({ ...formData, description: current.filter(p => p !== pref) });
    } else {
      setFormData({ ...formData, description: [...current, pref] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setLoading(true);

    try {
      const response = await ordersAPI.create({
        items: cart.map(item => ({ foodId: item.foodId, quantity: item.quantity })),
        deliveryDate: selectedDeliveryDate,
        deliveryTime: formData.preferredTime || '',
        customerDetails: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          description: formData.description.join(', '),
        }
      });

      if (formData.saveInfo) {
        localStorage.setItem(
          'deliveryInfo',
          JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            description: formData.description,
          }),
        );
      } else {
        localStorage.removeItem('deliveryInfo');
      }

      const { orderId, total } = response.data;
      navigate(`/payment/${orderId}?amount=${total}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light animate-fade">
        <div className="premium-card p-5 text-center bg-white animate-up" style={{ maxWidth: '400px' }}>
          <i className="bi bi-cart-x text-muted display-4 mb-4 opacity-20"></i>
          <h2 className="fw-800">Empty Order</h2>
          <p className="text-muted mb-4">Go back and add some items to your order!</p>
          <button onClick={() => navigate('/home')} className="btn-premium px-5 py-3">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light animate-fade pb-5">
      {/* Premium Navbar */}
      <nav className="glass-nav py-3 mb-4">
        <div className="container d-flex align-items-center">
          <button onClick={() => navigate('/cart')} className="btn btn-link text-dark p-0 me-3">
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <h4 className="fw-800 mb-0">Checkout Details</h4>
        </div>
      </nav>

      <div className="container px-4">
        <div className="row g-4">
          <div className="col-lg-8 animate-up">
            <form onSubmit={handleSubmit}>
              {/* Delivery Details Card */}
              <div className="premium-card p-4 p-md-5 mb-4 bg-white">
                <div className="d-flex align-items-center mb-4">
                  <div className="bg-primary-light p-2 rounded-3 me-3">
                    <i className="bi bi-person text-white f-5"></i>
                  </div>
                  <h5 className="fw-800 mb-0">Delivery Address</h5>
                </div>

                <div className="row g-4">
                  <div className="col-12">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-2">Recipient Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control form-control-lg bg-light border-0"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-2">Preferred Time</label>
                    <input
                      type="time"
                      name="preferredTime"
                      value={(formData as any).preferredTime || ''}
                      onChange={handleChange}
                      className="form-control form-control-lg bg-light border-0"
                      required
                    />
                    <small className="text-muted">Time for delivery on {format(new Date(selectedDeliveryDate), 'EEE, MMM dd')}</small>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-control form-control-lg bg-light border-0"
                      placeholder="10 digit phone number"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-2">Full Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-control form-control-lg bg-light border-0"
                      rows={4}
                      placeholder="House No, Street, Landmark, Area"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="premium-card p-4 p-md-5 mb-4 bg-white">
                <h5 className="fw-800 mb-4">Any special requests?</h5>
                <div className="row g-2">
                  {foodPrefs.map((pref) => (
                    <div key={pref} className="col-md-6">
                      <div
                        onClick={() => handlePrefChange(pref)}
                        className={`p-3 rounded-4 border transition cursor-pointer d-flex align-items-center gap-2 ${formData.description.includes(pref) ? 'border-primary bg-primary-light text-white' : 'bg-light border-light'}`}
                      >
                        <i className={`bi ${formData.description.includes(pref) ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                        <span className="fw-600">{pref}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card p-4 bg-white mb-4 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-800 mb-1">Save these details</h6>
                  <p className="text-muted small mb-0">Use this address for future orders</p>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    name="saveInfo"
                    checked={formData.saveInfo}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-100 py-3 fs-5"
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Continue to Payment'}
              </button>
            </form>
          </div>

          {/* Side Bill */}
          <div className="col-lg-4 animate-up" style={{ animationDelay: '0.1s' }}>
            <div className="premium-card p-4 bg-white sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-800 mb-4 pb-2 border-bottom">Order Summary</h5>
              <div className="mb-4">
                <div className="p-3 bg-light rounded-4">
                  <span className="text-muted small d-block mb-1">Delivering On</span>
                  <span className="fw-700 fs-5 text-primary"><i className="bi bi-clock me-2"></i>{format(new Date(selectedDeliveryDate), 'EEE, MMM dd')}</span>
                </div>
              </div>

              <div className="d-flex flex-column gap-3 mb-4">
                {cart.map((item) => (
                  <div key={item.foodId} className="d-flex justify-content-between">
                    <span className="text-muted small fw-500">{item.name} <span className="text-primary fw-700">x{item.quantity}</span></span>
                    <span className="fw-700 small">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-top pt-4">
                <div className="d-flex justify-content-between mb-3 text-muted">
                  <span>Bill Total</span>
                  <span className="fw-700">₹{getTotal().toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3 text-success">
                  <span>Delivery Charge</span>
                  <span className="fw-700">FREE</span>
                </div>
                <div className="d-flex justify-content-between align-items-center h4 fw-800 text-dark pt-2">
                  <span>To Pay</span>
                  <span className="text-primary">₹{getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bg-primary-light { background: var(--primary) !important; }
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-600 { font-weight: 600; }
        .fw-500 { font-weight: 500; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};

export default Order;
