// Sangrahak/src/services/api.ts - WITH AUTHENTICATION
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response.status === 401) {
        // Clear local storage and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_data');
        window.location.href = '/login';
      }
      
      console.error('Error response:', error.response.data);
      return Promise.reject(error.response.data || error);
    } else if (error.request) {
      console.error('No response received:', error.request);
      return Promise.reject({ message: 'No response from server' });
    } else {
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

  create: async (productData: any) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  update: async (id: string, productData: any) => {
    const response = await api.put(`/products/${id}`, productData);
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

// Depots API
export const depotsAPI = {
  getAll: async () => {
    const response = await api.get('/depots');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/depots/${id}`);
    return response.data;
  },

  create: async (depotData: any) => {
    const response = await api.post('/depots', depotData);
    return response.data;
  },

  update: async (id: string, depotData: any) => {
    const response = await api.put(`/depots/${id}`, depotData);
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
  }) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/alerts/${id}/read`);
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

// Health check API (no auth required)
export const healthAPI = {
  check: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    return response.data;
  },
};

// Auth API (no auth token needed for these)
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      username,
      password
    });
    return response.data;
  },

  verify: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  logout: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const response = await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// Utility functions
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

export default api;