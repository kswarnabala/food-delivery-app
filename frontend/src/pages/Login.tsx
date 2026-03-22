import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AppContext';
import { addDays, format } from 'date-fns';

const Login = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [deliveryDate, setDeliveryDate] = React.useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  const isAdminLogin = location.pathname === '/admin-login';

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  React.useEffect(() => {
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    setDeliveryDate(tomorrowStr);
    localStorage.setItem('selectedDeliveryDate', tomorrowStr);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // No hardcoded email check for admin, rely on server-side role check

      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      if (isAdminLogin && user.role !== 'admin') {
        setError('Admin access required');
        setLoading(false);
        return;
      }

      login(user, token);

      if (!isAdminLogin) {
        localStorage.setItem('selectedDeliveryDate', deliveryDate);
      }
      navigate('/home');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Animated Background Elements */}
      <div className="position-absolute top-0 start-0 w-100 h-100 opacity-5" style={{ zIndex: 0 }}>
        <div className="animate-float" style={{ position: 'absolute', top: '10%', left: '10%' }}><i className="bi bi-egg fs-1"></i></div>
        <div className="animate-float" style={{ position: 'absolute', top: '70%', left: '80%', animationDelay: '1s' }}><i className="bi bi-cup-hot fs-1"></i></div>
        <div className="animate-float" style={{ position: 'absolute', top: '40%', left: '85%', animationDelay: '0.5s' }}><i className="bi bi-pizza fs-1"></i></div>
      </div>

      <div className="container px-4 px-sm-5" style={{ maxWidth: '520px', zIndex: 1 }}>
        <div className="premium-card p-4 p-md-5 animate-up bg-white">
          <div className="text-center mb-5">
            <div className="d-inline-block bg-primary p-3 rounded-circle mb-4 animate-float">
              <i className="bi bi-bicycle text-white fs-2"></i>
            </div>
            <h1 className="fw-800 text-primary mb-1" style={{ letterSpacing: '-1px' }}>
              {isAdminLogin ? 'Admin Central' : 'FoodDelivery'}
            </h1>
            <p className="text-muted fw-500">
              {isAdminLogin ? 'Welcome back, Admin' : 'Order the best food in town'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="needs-validation d-flex flex-column gap-4">
            <div>
              <label className="form-label small fw-700 text-muted text-uppercase mb-2">Email</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-muted"></i></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAdminLogin ? 'admin@hotel.com' : 'your@email.com'}
                  className="form-control form-control-lg bg-light border-0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label small fw-700 text-muted text-uppercase mb-2">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-lock text-muted"></i></span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control form-control-lg bg-light border-0"
                  required
                />
              </div>
            </div>

            {!isAdminLogin && (
              <div className="p-4 rounded-4 bg-light border-1" style={{ border: '1px dashed #DDD' }}>
                <label className="form-label small fw-700 text-muted text-uppercase mb-3 d-block text-center">
                  <i className="bi bi-calendar-event me-2"></i>Choose Delivery Date
                </label>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <div
                      onClick={() => setDeliveryDate(format(tomorrow, 'yyyy-MM-dd'))}
                      className={`py-3 px-2 text-center rounded-3 cursor-pointer border transition ${deliveryDate === format(tomorrow, 'yyyy-MM-dd') ? 'border-primary bg-primary-light text-white' : 'bg-white border-light'}`}
                    >
                      <span className="d-block small opacity-75">{format(tomorrow, 'EEE')}</span>
                      <span className="fw-700">Tomorrow</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div
                      onClick={() => setDeliveryDate(format(dayAfter, 'yyyy-MM-dd'))}
                      className={`py-3 px-2 text-center rounded-3 cursor-pointer border transition ${deliveryDate === format(dayAfter, 'yyyy-MM-dd') ? 'border-primary bg-primary-light text-white' : 'bg-white border-light'}`}
                    >
                      <span className="d-block small opacity-75">{format(dayAfter, 'EEE')}</span>
                      <span className="fw-700">{format(dayAfter, 'MMM dd')}</span>
                    </div>
                  </div>
                </div>
                <input
                  type="date"
                  className="form-control border-0 bg-white"
                  min={format(tomorrow, 'yyyy-MM-dd')}
                  max={format(dayAfter, 'yyyy-MM-dd')}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            )}

            {error && (
              <div className="alert alert-danger border-0 rounded-3 py-2 px-3 small animate-fade">
                <i className="bi bi-exclamation-circle me-2"></i>{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-100 btn-lg fs-5 mt-2 py-3"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                isAdminLogin ? 'Enter Admin Dashboard' : 'Start Ordering'
              )}
            </button>
          </form>

          <div className="text-center mt-5">
            {isAdminLogin ? (
              <p className="text-muted small">
                Back to regular service?{' '}
                <a href="/login" className="text-primary text-decoration-none fw-700">Customer Login</a>
              </p>
            ) : (
              <div className="d-flex flex-column gap-2">
                <p className="text-muted small mb-0">
                  New to FoodDelivery?{' '}
                  <a href="/register" className="text-primary text-decoration-none fw-700">Create Account</a>
                </p>
                <div className="border-top pt-3 mt-2">
                  <a href="/admin-login" className="text-muted text-decoration-none small">
                    <i className="bi bi-shield-lock me-1"></i>Admin Access
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .bg-primary-light { background: var(--primary) !important; }
        .text-primary { color: var(--primary) !important; }
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-500 { font-weight: 500; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};

export default Login;
