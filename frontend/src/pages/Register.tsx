import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AppContext';

const Register = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'customer',
      });

      const { token, user } = response.data;
      login(user, token);
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Animated Background Elements */}
      <div className="position-absolute top-0 start-0 w-100 h-100 opacity-5" style={{ zIndex: 0 }}>
        <div className="animate-float" style={{ position: 'absolute', top: '15%', left: '15%' }}><i className="bi bi-egg fs-1"></i></div>
        <div className="animate-float" style={{ position: 'absolute', top: '75%', left: '85%', animationDelay: '1s' }}><i className="bi bi-cup-hot fs-1"></i></div>
        <div className="animate-float" style={{ position: 'absolute', top: '45%', left: '80%', animationDelay: '0.5s' }}><i className="bi bi-pizza fs-1"></i></div>
      </div>

      <div className="container px-4 py-5" style={{ maxWidth: '520px', zIndex: 1 }}>
        <div className="premium-card p-4 p-md-5 animate-up bg-white">
          <div className="text-center mb-5">
            <h1 className="fw-800 text-primary mb-1" style={{ letterSpacing: '-1px' }}>Create Account</h1>
            <p className="text-muted fw-500">Join FoodDelivery today for a premium experience</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="form-label small fw-700 text-muted text-uppercase mb-2">Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-person text-muted"></i></span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="form-control form-control-lg bg-light border-0"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-700 text-muted text-uppercase mb-2">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-muted"></i></span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="form-control form-control-lg bg-light border-0"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-700 text-muted text-uppercase mb-2">Phone Number</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-telephone text-muted"></i></span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10 digit number"
                  className="form-control form-control-lg bg-light border-0"
                  required
                />
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-700 text-muted text-uppercase mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-control form-control-lg bg-light border-0"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-700 text-muted text-uppercase mb-2">Confirm</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-control form-control-lg bg-light border-0"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger border-0 rounded-3 py-2 px-3 small mb-4 animate-fade">
                <i className="bi bi-exclamation-circle me-2"></i>{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-100 py-3 fs-5 mt-2"
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Create My Account'}
            </button>
          </form>

          <div className="text-center mt-5">
            <p className="text-muted small">
              Already have an account?{' '}
              <a href="/login" className="text-primary text-decoration-none fw-700">Login here</a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-500 { font-weight: 500; }
      `}</style>
    </div>
  );
};

export default Register;
