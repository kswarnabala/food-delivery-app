import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { foodsAPI } from '../utils/api';
import { useCart } from '../context/AppContext';

interface Food {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
}

const FoodDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const getFoodImage = (f: Food) => {
    if (f.image_url) return f.image_url;

    const base = 'https://images.unsplash.com/';

    switch (f.category) {
      case 'Rice':
        return `${base}photo-1604908176997-125188c82c51?w=800&q=80`;
      case 'Gravy':
        return `${base}photo-1543353071-873f17a7a088?w=800&q=80`;
      case 'Fry':
        return `${base}photo-1608038509085-7bb9d5c0a3aa?w=800&q=80`;
      case 'Dry':
        return `${base}photo-1619252584172-8e306f105c39?w=800&q=80`;
      case 'Combo':
        return `${base}photo-1604908176997-125188c82c51?w=800&q=80`;
      case 'Drinks':
        return `${base}photo-1544145945-f90425340c7e?w=800&q=80`;
      default:
        return `${base}photo-1546069901-ba9599a7e63c?w=800&q=80`;
    }
  };

  useEffect(() => {
    const fetchFood = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await foodsAPI.getById(parseInt(id, 10));
        setFood(response.data);
      } catch (error) {
        console.error('Failed to fetch food:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [id]);

  const handleAddToCart = () => {
    if (!food) return;
    addToCart({
      foodId: food.id,
      name: food.name,
      price: food.price,
      quantity,
    });
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <p className="text-muted mb-4">Food item not found.</p>
          <button onClick={() => navigate('/home')} className="btn-premium px-4 py-2">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: 'var(--background)' }}>
      <div className="container py-5">
        <button onClick={() => navigate(-1)} className="btn btn-link text-primary mb-3 px-0">
          <i className="bi bi-arrow-left me-1" /> Back
        </button>

        <div className="premium-card bg-white p-4 p-md-5 animate-up">
          <div className="row g-4 align-items-center">
            <div className="col-md-5">
              <div className="position-relative overflow-hidden rounded-4" style={{ minHeight: '260px' }}>
                <img
                  src={getFoodImage(food)}
                  alt={food.name}
                  className="w-100 h-100 object-fit-cover"
                />
                <span className="badge bg-white text-dark position-absolute top-3 start-3 rounded-pill px-3 py-2 fw-700 shadow-sm">
                  {food.category}
                </span>
              </div>
            </div>

            <div className="col-md-7">
              <h1 className="fw-800 mb-2">{food.name}</h1>
              <p className="text-muted mb-4">{food.description}</p>

              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <span className="text-muted small d-block">Price</span>
                  <span className="fw-800 fs-3 text-primary">₹{food.price}</span>
                </div>
                <div>
                  <span className="text-muted small d-block">Rating</span>
                  <span className="fw-700">
                    <i className="bi bi-star-fill text-warning me-1" />4.5
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 mb-4">
                <span className="text-muted small text-uppercase fw-700">Quantity</span>
                <div className="d-flex align-items-center border rounded-pill px-2 py-1 bg-light">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="btn btn-link text-dark px-2 py-0"
                  >
                    −
                  </button>
                  <span className="mx-2 fw-700">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="btn btn-link text-dark px-2 py-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="btn-premium btn-lg px-4"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fw-800 { font-weight: 800; }
      `}</style>
    </div>
  );
};

export default FoodDetail;
