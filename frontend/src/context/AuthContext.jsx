import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    return (stored && stored !== 'null' && stored !== 'undefined') ? stored : '';
  });
  const [loading, setLoading] = useState(true);

  // Setup interceptors and fetch profile on load if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data.data.user);
        } catch (error) {
          console.error('Invalid token, logging out...');
          logout();
        }
      } else {
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      if (res.data.status === 'otp_required') {
        return { success: true, otpRequired: true, email };
      }

      const { token: userToken, data } = res.data;
      localStorage.setItem('token', userToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      setToken(userToken);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message: msg };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await axios.post('/api/auth/verify-otp', { email, otp });
      const { token: userToken, data } = res.data;
      
      localStorage.setItem('token', userToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      setToken(userToken);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'OTP verification failed.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken('');
    setUser(null);
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await axios.post('/api/auth/change-password', { oldPassword, newPassword });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Update failed.';
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verifyOtp, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
