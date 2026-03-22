import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { foodsAPI, reviewsAPI } from '../utils/api';
import { useCart, useAuth } from '../context/AppContext';

interface Food {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const FoodDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string>('');

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

  const fetchReviews = async (foodId: number) => {
    try {
      const resp = await reviewsAPI.getByFood(foodId);
      setReviews(resp.data.reviews || []);
      setAvgRating(resp.data.avgRating || 0);
      setReviewCount(resp.data.totalRatings || 0);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  useEffect(() => {
    const fetchFood = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await foodsAPI.getById(id);
        setFood(response.data);
        await fetchReviews(parseInt(id, 10));
      } catch (error) {
        console.error('Failed to fetch food:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [id]);

  const handleReviewSubmit = async () => {
    if (!food) return;
    if (!user) {
      setReviewError('Please log in to submit a review.');
      return;
    }
    if (!comment.trim()) {
      setReviewError('Please write a comment.');
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError('');
      await reviewsAPI.create(food.id, { rating, comment });
      setComment('');
      setRating(5);
      await fetchReviews(food.id);
    } catch (error) {
      setReviewError('Failed to submit review.');
      console.error(error);
    } finally {
      setReviewLoading(false);
    }
  };

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
                    <i className="bi bi-star-fill text-warning me-1" />{avgRating || 0} ({reviewCount})
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

        <div className="premium-card bg-white p-4 mt-4 animate-up">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 className="fw-800 mb-1">Customer Reviews</h3>
              <p className="text-muted small">Share your experience and see other ratings.</p>
            </div>
            <span className="badge bg-warning text-dark rounded-pill">Avg {avgRating || 0}</span>
          </div>

          <div className="mb-3">
            <div className="d-flex gap-2 align-items-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`btn btn-sm ${star <= rating ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setRating(star)}
                  type="button"
                >
                  ★
                </button>
              ))}
              <span className="text-muted small">{rating}/5</span>
            </div>
            <textarea
              className="form-control mb-2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review..."
              rows={3}
            />
            {reviewError && <div className="text-danger small mb-2">{reviewError}</div>}
            <button
              onClick={handleReviewSubmit}
              disabled={reviewLoading}
              className="btn btn-primary btn-sm"
              type="button"
            >
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>

          <div className="mt-4">
            {reviews.length === 0 ? (
              <div className="text-muted small">No reviews yet. Be the first to rate.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-3 p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong>{review.user_name}</strong>
                      <span className="badge bg-warning text-dark">{review.rating} ★</span>
                    </div>
                    <p className="mb-1 small text-muted">{new Date(review.created_at).toLocaleString()}</p>
                    <p className="mb-0">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
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
