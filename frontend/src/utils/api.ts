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
  getAll: (category?: string) => api.get('/foods', { params: { category } }),
  getById: (id: string) => api.get(`/foods/${id}`),
  create: (data: any) => api.post('/foods', data),
  update: (id: number, data: any) => api.put(`/foods/${id}`, data),
  delete: (id: number) => api.delete(`/foods/${id}`),
};

export const ordersAPI = {
  create: (data: any) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getAllAdmin: () => api.get('/orders/admin/all'),
  getById: (id: number) => api.get(`/orders/${id}`),
};

export const paymentsAPI = {
  create: (data: any) => api.post('/payments', data),
  complete: (id: number) => api.put(`/payments/${id}/complete`),
  getById: (id: number) => api.get(`/payments/${id}`),
};

export default api;
