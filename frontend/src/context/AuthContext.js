import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { requestNotificationPermission, subscribeToPushNotifications } from '../utils/pushNotifications';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data.user);
      
      // Setup push notifications for verified users
      if (response.data.user.isEmailVerified) {
        setupPushNotifications();
      }
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const setupPushNotifications = async () => {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      const subscription = await subscribeToPushNotifications();
      if (subscription) {
        await axios.post(`${API_URL}/api/auth/subscribe-push`, { subscription });
      }
    }
  };

  const login = async (tokenOrEmail, passwordOrUser) => {
    // Handle direct login with token (from email verification)
    if (typeof passwordOrUser === 'object') {
      localStorage.setItem('token', tokenOrEmail);
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenOrEmail}`;
      setUser(passwordOrUser);
      
      if (passwordOrUser.isEmailVerified) {
        setupPushNotifications();
      }
      
      return { success: true };
    }

    // Handle normal login
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: tokenOrEmail,
        password: passwordOrUser,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      if (user.isEmailVerified) {
        setupPushNotifications();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        requiresVerification: error.response?.data?.requiresVerification
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password,
      });

      return { 
        success: true, 
        message: response.data.message,
        requiresVerification: response.data.requiresVerification
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
