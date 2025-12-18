// Sangrahak/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface Admin {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  lastLogin?: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedAdmin = localStorage.getItem('admin_data');

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Verify token validity
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });

      if (response.data.success) {
        setAdmin(response.data.admin);
        setToken(tokenToVerify);
      } else {
        // Token invalid, clear storage
        logout();
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        const { token: newToken, admin: adminData } = response.data;
        
        // Store in state
        setToken(newToken);
        setAdmin(adminData);
        
        // Store in localStorage
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('admin_data', JSON.stringify(adminData));

        setError(null);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_data');
    setError(null);
  };

  const value: AuthContextType = {
    admin,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!admin,
    isLoading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};