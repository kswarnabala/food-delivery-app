import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        {user && (
          <div className="card space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
              <p className="text-lg font-semibold">{user.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Account Type</label>
              <p className="text-lg font-semibold capitalize">{user.role}</p>
            </div>

            <div className="pt-6 border-t">
              <button
                onClick={() => navigate('/my-orders')}
                className="btn-primary mb-4 w-full"
              >
                View My Orders
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
