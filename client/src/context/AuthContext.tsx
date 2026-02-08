'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/utils';

interface User {
  id: number;
  name: string;
  email: string;
  role: string; // Can be 'admin', 'seller', or custom role name
  role_id?: number;
  created_at: string;
  updated_at: string;
  // Basic user fields
  phone?: string;
  brand_name?: string;
  // Seller-specific fields
  cin?: string;
  account_holder?: string;
  bank_name?: string;
  rib?: string;
  balance?: number;
  points?: number;
  referral_code?: string;
  referred_by_id?: number;
  is_verified?: boolean;
  avatar?: string;
  // Permissions for employees
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirect_url?: string }>;
  logout: () => void;
  fetchUserData: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isEmployee: boolean;
  isVerified: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = '/api';
const API_URL = getApiUrl();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear auth state
  const clearAuthState = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Fetch fresh user data from the database
  const fetchUserData = async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setUser(result.data);
          localStorage.setItem('user', JSON.stringify(result.data));
        }
      } else if (response.status === 401) {
        // Token is invalid, clear auth state
        clearAuthState();
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        // Fetch fresh data from database after initial load
        setTimeout(() => fetchUserData(), 100);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        clearAuthState();
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { token: authToken, user: userData, redirect_url } = data;

        // Store auth data in localStorage
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(authToken);
        setUser(userData);

        let finalRedirect = redirect_url;
        if (userData.role_id && userData.role !== 'admin' && userData.role !== 'seller') {
          finalRedirect = '/admin';
        }

        return { success: true, redirect_url: finalRedirect };
      } else {
        return {
          success: false,
          error: data.message || data.email?.[0] || 'Login failed. Please check your credentials.'
        };
      }
    } catch (error) {
      console.error('Login error:', error);

      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  };

  const logout = () => {
    clearAuthState();
    // Force page reload to ensure all components recognize the logout
    window.location.href = '/signin';
  };

  // Computed properties
  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';
  const isSeller = user?.role === 'seller';
  const isEmployee = !!user?.role_id && user?.role !== 'admin' && user?.role !== 'seller';
  const isVerified = user?.is_verified ?? false;

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (isAdmin) return true; // Admins have all permissions
    if (user?.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    return false;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    fetchUserData,
    loading,
    isAuthenticated,
    isAdmin,
    isSeller,
    isEmployee,
    isVerified,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}