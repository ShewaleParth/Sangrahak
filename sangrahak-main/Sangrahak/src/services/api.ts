// src/services/api.ts - NO AUTHENTICATION VERSION
import axios from 'axios';
import { Product, Depot, Alert, KPI, TopSKU, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - NO AUTH LOGIC
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - NO AUTH ERROR HANDLING
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      console.error('Error response:', error.response.data);
      return Promise.reject(error.response.data || error);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      return Promise.reject({ message: 'No response from server' });
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

// Products API
export const productsAPI = {
  getAll: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

    getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  

  create: async (productData: Omit<Product, 'id' | 'lastSoldDate'>) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  update: async (id: string, productData: Partial<Product>) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  updateStock: async (id: string, newStock: number, mode: 'set' | 'inc' | 'dec' = 'set') => {
    const response = await api.patch(`/products/${id}/stock`, { stock: newStock, mode });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },
};

// Add these methods to your depotsAPI in services/api.ts

export const depotsAPI = {
  getAll: async () => {
    const response = await api.get('/depots');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/depots/${id}`);
    return response.data;
  },

  create: async (depotData: Omit<Depot, 'id'>) => {
    const response = await api.post('/depots', depotData);
    return response.data;
  },

  update: async (id: string, depotData: Partial<Depot>) => {
    const response = await api.put(`/depots/${id}`, depotData);
    return response.data;
  },

  updateUtilization: async (id: string, data: { currentUtilization?: number; itemsStored?: number }) => {
    const response = await api.patch(`/depots/${id}/utilization`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/depots/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/depots/stats/overview');
    return response.data;
  },
};



// Alerts API
export const alertsAPI = {
  getAll: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
    type?: string;
    severity?: string;
  }) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/alerts/${id}/read`);
    return response.data;
  },

  markAsResolved: async (id: string, data: { resolvedBy: string; resolutionNotes?: string }) => {
    const response = await api.patch(`/alerts/${id}/resolve`, data);
    return response.data;
  },

  bulkMarkAsRead: async (alertIds: string[]) => {
    const response = await api.patch('/alerts/bulk/read', { alertIds });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/alerts/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/alerts/stats/overview');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getTopSKUs: async () => {
    const response = await api.get('/dashboard/top-skus');
    return response.data;
  },
};

// Health check API
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Utility functions for data manipulation (no auth needed)
export const dataUtils = {
  formatCurrency: (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  formatDate: (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  },

  getStatusColor: (status: string) => {
    const statusColors = {
      'in-stock': 'green',
      'low-stock': 'yellow',
      'out-of-stock': 'red',
      'overstock': 'blue',
    };
    return statusColors[status as keyof typeof statusColors] || 'gray';
  },

  getSeverityColor: (severity: string) => {
    const severityColors = {
      'low': 'blue',
      'medium': 'yellow',
      'high': 'red',
    };
    return severityColors[severity as keyof typeof severityColors] || 'gray';
  },
};

// Export default api instance for custom requests
export default api;