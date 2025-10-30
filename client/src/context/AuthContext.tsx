'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'seller';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirect_url?: string }>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = '/api';

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

  // Check authentication status on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        clearAuthState();
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/signin`, {
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

        return { success: true, redirect_url };
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

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated,
    isAdmin,
    isSeller,
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