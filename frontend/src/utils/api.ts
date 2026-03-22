import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const foodsAPI = {
  getAll: (category?: string) => api.get('/foods', { params: { category, t: Date.now() } }),
  getById: (id: string) => api.get(`/foods/${id}`),
  create: (data: any) => api.post('/foods', data),
  update: (id: number, data: any) => api.put(`/foods/${id}`, data),
  delete: (id: number) => api.delete(`/foods/${id}`),
};

export const reviewsAPI = {
  getByFood: (foodId: number) => api.get(`/foods/${foodId}/reviews`),
  create: (foodId: number, data: { rating: number; comment: string }) => api.post(`/foods/${foodId}/reviews`, data),
};

export const chatAPI = {
  getMessages: (userId?: number) => api.get('/chat/messages', { params: userId ? { userId } : {} }),
  sendMessage: (message: string, userId?: number) => api.post('/chat/messages', { message, userId }),
  editMessage: (id: number, message: string) => api.put(`/chat/messages/${id}`, { message }),
  deleteMessage: (id: number) => api.delete(`/chat/messages/${id}`),
  availability: () => api.get('/chat/availability'),
  updateAvailability: (data: any) => api.put('/chat/availability', data)
};

export const ordersAPI = {
  create: (data: any) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getAllAdmin: () => api.get('/orders/admin/all'),
  getById: (id: number) => api.get(`/orders/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/orders/${id}/status`, { status }),
};

export const paymentsAPI = {
  create: (data: any) => api.post('/payments', data),
  complete: (id: number) => api.put(`/payments/${id}/complete`),
  getById: (id: number) => api.get(`/payments/${id}`),
};

export default api;
