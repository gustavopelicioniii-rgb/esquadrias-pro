import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('esquadrias_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const auth = {
  register: (data: { name: string; email: string; password: string; organizationName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Clients
export const clients = {
  list: () => api.get('/clients'),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Products
export const products = {
  list: () => api.get('/products'),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Budgets
export const budgets = {
  list: () => api.get('/budgets'),
  create: (data: any) => api.post('/budgets', data),
  update: (id: string, data: any) => api.put(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

// Orders
export const orders = {
  list: () => api.get('/orders'),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

// Transactions
export const transactions = {
  list: () => api.get('/transactions'),
  create: (data: any) => api.post('/transactions', data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

// Dashboard
export const dashboard = {
  get: () => api.get('/dashboard'),
};

// Materials
export const materials = {
  profiles: { list: () => api.get('/profiles'), create: (data: any) => api.post('/profiles', data) },
  glasses: { list: () => api.get('/glasses'), create: (data: any) => api.post('/glasses', data) },
  accessories: { list: () => api.get('/accessories'), create: (data: any) => api.post('/accessories', data) },
  inventory: { list: () => api.get('/inventory'), create: (data: any) => api.post('/inventory', data) },
};

export default api;
