import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodsAPI } from '../utils/api';
import { useCart, useAuth } from '../context/AppContext';
import { format } from 'date-fns';

interface Food {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
}

const Home = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity, removeFromCart } = useCart();
  const { user, logout } = useAuth();

  const categories = ['Rice', 'Gravy', 'Fry', 'Dry', 'Combo', 'Drinks'];
  const selectedDeliveryDate = localStorage.getItem('selectedDeliveryDate') || format(new Date(), 'yyyy-MM-dd');

  const getFoodImage = (food: Food) => {
    if (food.image_url) return food.image_url;

    const base = 'https://images.unsplash.com/';

    switch (food.category) {
      case 'Rice':
        return `${base}photo-1604908176997-125188c82c51?w=600&q=80`;
      case 'Gravy':
        return `${base}photo-1543353071-873f17a7a088?w=600&q=80`;
      case 'Fry':
        return `${base}photo-1608038509085-7bb9d5c0a3aa?w=600&q=80`;
      case 'Dry':
        return `${base}photo-1619252584172-8e306f105c39?w=600&q=80`;
      case 'Combo':
        return `${base}photo-1604908176997-125188c82c51?w=600&q=80`;
      case 'Drinks':
        return `${base}photo-1544145945-f90425340c7e?w=600&q=80`;
      default:
        return `${base}photo-1546069901-ba9599a7e63c?w=600&q=80`;
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [selectedCategory]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await foodsAPI.getAll(selectedCategory || undefined);
      setFoods(response.data || []);
    } catch (error) {
      console.error('Failed to fetch foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemQuantity = (id: number) => {
    const item = cart.find(i => i.foodId === id);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (food: Food) => {
    addToCart({
      foodId: food.id,
      name: food.name,
      price: food.price,
      quantity: 1,
    });
  };

  const handleViewDetails = (foodId: number) => {
    navigate(`/foods/${foodId}`);
  };

  return (
    <div className="min-vh-100 animate-fade">
      {/* Premium Navbar */}
      <nav className="glass-nav py-3">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
            <span className="fs-3 fw-800 text-primary" style={{ letterSpacing: '-1px' }}>FoodDelivery</span>
          </div>
          <div className="d-flex align-items-center gap-4">
            <div className="d-none d-md-block">
              <span className="text-muted small d-block">Delivering to you on:</span>
              <span className="fw-700">{format(new Date(selectedDeliveryDate), 'EEE, MMM dd')}</span>
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="btn btn-link text-primary p-0 text-decoration-none fw-700 small"
              >
                <i className="bi bi-speedometer2 me-1"></i> Admin Dashboard
              </button>
            )}

            {user?.role !== 'admin' && (
              <button
                onClick={() => navigate('/my-orders')}
                className="btn btn-outline-primary rounded-pill px-3 py-1 fw-700 small"
              >
                <i className="bi bi-bag-check me-1"></i> My Orders
              </button>
            )}

            <button onClick={() => navigate('/cart')} className="btn-premium px-4 position-relative">
              Cart
              {cart.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-white text-primary border border-primary">
                  {cart.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
            <button
              className="btn btn-link text-muted small p-0"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Logout
            </button>
            <div
              className="bg-primary-light rounded-circle d-flex align-items-center justify-content-center cursor-pointer"
              style={{ width: '45px', height: '45px' }}
              onClick={() => navigate('/my-orders')}
            >
              <i className="bi bi-bag-fill text-white fs-4"></i>
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Hero */}
      <div className="container mt-5 mb-5 px-4 overflow-hidden">
        <div className="premium-card p-5 bg-primary text-white position-relative overflow-hidden animate-up">
          <div className="row align-items-center position-relative" style={{ zIndex: 2 }}>
            <div className="col-lg-7">
              <span className="badge bg-white text-primary mb-3 px-3 py-2 rounded-pill fw-700">60% OFF ON FIRST ORDER</span>
              <h1 className="display-4 fw-800 mb-3">Craving for something <br /> delicious?</h1>
              <p className="fs-5 opacity-75 mb-4">Premium flavors, super fast delivery, and the best quality ingredients just for you.</p>
              <button className="btn btn-light rounded-pill px-5 py-3 fw-800 text-primary fs-5 border-0 shadow-lg">Order Now</button>
            </div>
            <div className="col-lg-5 d-none d-lg-block">
              <div className="animate-float">
                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80" alt="Hero" className="img-fluid rounded-circle" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-5 px-4">
        {/* Horizontal Category Scroll */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h3 className="fw-800 mb-1">Explore Categories</h3>
              <p className="text-muted mb-0">What's on your mind today?</p>
            </div>
          </div>
          <div className="d-flex gap-3 overflow-auto pb-3 no-scrollbar">
            <div
              onClick={() => setSelectedCategory('')}
              className={`category-pill ${!selectedCategory ? 'active' : ''}`}
            >
              All Items
            </div>
            {categories.map((cat) => (
              <div
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        {/* Premium Food Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4 animate-fade">
            {foods.map((food, index) => {
              const quantityInRange = getItemQuantity(food.id);
              return (
                <div key={food.id} className="col-12 col-md-6 col-lg-4 col-xl-3 animate-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="premium-card h-100 d-flex flex-column">
                    <div className="position-relative overflow-hidden cursor-pointer" onClick={() => handleViewDetails(food.id)}>
                      <div className="position-relative overflow-hidden" style={{ height: '200px' }}>
                        <img
                          src={getFoodImage(food)}
                          alt={food.name}
                          className="w-100 h-100 object-fit-cover transition-scale"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const base = 'https://images.unsplash.com/';
                            let fallback = `${base}photo-1504674900247-0877df9cc836?w=500&q=80`;

                            switch (food.category) {
                              case 'Rice': fallback = `${base}photo-1604908176997-125188c82c51?w=600&q=80`; break;
                              case 'Gravy': fallback = `${base}photo-1543353071-873f17a7a088?w=600&q=80`; break;
                              case 'Fry': fallback = `${base}photo-1608038509085-7bb9d5c0a3aa?w=600&q=80`; break;
                              case 'Dry': fallback = `${base}photo-1619252584172-8e306f105c39?w=600&q=80`; break;
                              case 'Drinks': fallback = `${base}photo-1544145945-f90425340c7e?w=600&q=80`; break;
                            }

                            if (target.src !== fallback) {
                              target.src = fallback;
                            }
                          }}
                        />
                        <div className="position-absolute bottom-0 start-0 w-100 p-3 bg-gradient-dark">
                          <span className="badge bg-white text-dark rounded-pill px-3 py-2 fw-700 shadow-sm">
                            <i className="bi bi-star-fill text-warning me-1"></i> 4.5
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex-grow-1 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-700 mb-0 text-truncate">{food.name}</h5>
                        <div className="small text-muted"><i className="bi bi-star-fill text-warning me-1"></i>4.5</div>
                      </div>
                      <p className="small text-muted mb-4 line-clamp-2">{food.description || 'Appetizing flavor prepared fresh for you.'}</p>

                      <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top border-light">
                        <span className="fw-800 fs-5">₹{food.price}</span>

                        {user?.role === 'admin' ? (
                          <span className="badge bg-light text-muted rounded-pill px-3 py-2">Admin preview</span>
                        ) : quantityInRange === 0 ? (
                          <button
                            className="btn btn-outline-primary fw-800 px-4 rounded-3 border-2 hover-bg-primary hover-text-white transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(food);
                            }}
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="cart-control" onClick={(e) => e.stopPropagation()}>
                            <button className="cart-btn" onClick={() => updateQuantity(food.id, quantityInRange - 1)}>−</button>
                            <span className="cart-count">{quantityInRange}</span>
                            <button className="cart-btn" onClick={() => updateQuantity(food.id, quantityInRange + 1)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .transition-scale { transition: transform 0.4s ease; }
        .premium-card:hover .transition-scale { transform: scale(1.1); }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        .cursor-pointer { cursor: pointer; }
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
          padding: 5px 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .cart-btn:hover { background: rgba(0,0,0,0.2); }
        .cart-count {
          padding: 0 12px;
          font-weight: 800;
          min-width: 35px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default Home;
