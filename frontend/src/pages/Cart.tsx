import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/AppContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();

  const handleCheckout = () => {
    navigate('/order');
  };

  if (cart.length === 0) {
    return (
      <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center animate-fade">
        <div className="premium-card p-5 text-center bg-white animate-up shadow-sm">
          <div className="mb-4 opacity-20">
            <i className="bi bi-cart-x" style={{ fontSize: '5rem' }}></i>
          </div>
          <h2 className="fw-800 mb-2">Your cart is empty</h2>
          <p className="text-muted mb-4 fs-5">Seems like you haven't added anything yet.</p>
          <button onClick={() => navigate('/home')} className="btn-premium px-5 py-3 fs-5">
            Start Ordering
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light pb-5 animate-fade">
      {/* Premium Header */}
      <nav className="glass-nav py-3 mb-5">
        <div className="container d-flex align-items-center">
          <button onClick={() => navigate('/home')} className="btn btn-link text-dark p-0 me-3">
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <h4 className="fw-800 mb-0">My Cart</h4>
        </div>
      </nav>

      <div className="container">
        <div className="row g-4">
          {/* Cart Items */}
          <div className="col-lg-8">
            <div className="premium-card p-4 bg-white animate-up shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-800 mb-0">Items in Cart ({cart.length})</h5>
                <button onClick={clearCart} className="btn btn-link text-muted small p-0 text-decoration-none">
                  Clear All
                </button>
              </div>

              {cart.map((item) => (
                <div key={item.foodId} className="d-flex align-items-center gap-3 py-4 border-bottom border-light animate-up">
                  <div className="bg-light rounded-4 overflow-hidden shadow-sm" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                    <img
                      src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80&food=${item.name}`}
                      alt={item.name}
                      className="w-100 h-100 object-fit-cover"
                    />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="fw-800 mb-1 fs-5">{item.name}</h6>
                    <p className="text-primary fw-700 mb-0">₹{item.price}</p>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="cart-control">
                      <button className="cart-btn" onClick={() => updateQuantity(item.foodId, item.quantity - 1)}>−</button>
                      <span className="cart-count">{item.quantity}</span>
                      <button className="cart-btn" onClick={() => updateQuantity(item.foodId, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Summary */}
          <div className="col-lg-4">
            <div className="premium-card p-4 bg-white animate-up shadow-sm" style={{ animationDelay: '0.1s' }}>
              <h5 className="fw-800 mb-4">Order Summary</h5>
              <div className="d-flex justify-content-between mb-3 text-muted">
                <span>Items Total</span>
                <span>₹{getTotal()}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 text-muted">
                <span>Delivery Fee</span>
                <span className="text-success fw-700">FREE</span>
              </div>
              <div className="d-flex justify-content-between mb-4 fs-5 border-top pt-3">
                <span className="fw-800">Grand Total</span>
                <span className="fw-800 text-primary">₹{getTotal()}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="btn-premium w-100 py-3 fs-5 shadow-lg"
              >
                Proceed to Checkout
              </button>
            </div>
            <div className="mt-4 p-3 bg-white-transparent rounded-4 border-dashed text-center">
              <p className="small text-muted mb-0">
                <i className="bi bi-shield-check me-2 text-success"></i>
                Safe and secure payments
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .cart-control {
          display: flex;
          align-items: center;
          background: #FF523B;
          color: white;
          border-radius: 8px;
          overflow: hidden;
        }
        .cart-btn {
          background: rgba(0,0,0,0.1);
          border: none;
          color: white;
          padding: 8px 15px;
          font-weight: 800;
          cursor: pointer;
        }
        .cart-btn:hover { background: rgba(0,0,0,0.2); }
        .cart-count {
          padding: 0 15px;
          font-weight: 800;
          min-width: 40px;
          text-align: center;
        }
        .border-dashed { border: 2px dashed #EEE; }
        .bg-white-transparent { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(10px); }
      `}</style>
    </div>
  );
};

export default Cart;
