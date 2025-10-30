import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Cấu hình axios với token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Đăng ký
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data.data; // Fix: đọc từ data.data
      if (token) {
        localStorage.setItem('token', token);
        setToken(token);
        setCurrentUser(user);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  };

  // Đăng nhập
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });
      const { token, user } = response.data.data; // Fix: đọc từ data.data
      if (token) {
        localStorage.setItem('token', token);
        setToken(token);
        setCurrentUser(user);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Kiểm tra token khi app load
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/verify');
          // ApiResponse wrapper => data.user
          const verifiedUser = response.data?.data?.user || response.data?.user || null;
          setCurrentUser(verifiedUser);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const value = {
    currentUser,
    token,
    register,
    login,
    logout,
    isAdmin: currentUser?.role === 'admin',
    isVip: currentUser?.role === 'vip',
    isVipOrAdmin: currentUser?.role === 'vip' || currentUser?.role === 'admin',
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
