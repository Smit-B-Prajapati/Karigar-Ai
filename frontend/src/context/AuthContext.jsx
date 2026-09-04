import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/authService.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('karigar_token') || null);
  const [loading, setLoading] = useState(true);

  // Persistent login session check on refresh
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('karigar_token');
      if (storedToken) {
        try {
          const fetchPromise = getCurrentUser(storedToken);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth verify timeout')), 1500)
          );

          const res = await Promise.race([fetchPromise, timeoutPromise]);
          if (res.success && res.user && isMounted) {
            setUser(res.user);
            setToken(storedToken);
          } else if (isMounted) {
            localStorage.removeItem('karigar_token');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.warn('Session verification error/timeout, resetting token:', err.message);
          if (isMounted) {
            localStorage.removeItem('karigar_token');
            setToken(null);
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = async (emailOrPhoneOrCredentials, passwordParam) => {
    setLoading(true);
    try {
      let credentials;
      if (typeof emailOrPhoneOrCredentials === 'object' && emailOrPhoneOrCredentials !== null) {
        credentials = emailOrPhoneOrCredentials;
      } else {
        credentials = {
          emailOrPhone: emailOrPhoneOrCredentials,
          email: emailOrPhoneOrCredentials,
          password: passwordParam,
        };
      }

      const res = await loginUser(credentials);
      if (res.success && res.token) {
        localStorage.setItem('karigar_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setLoading(false);
        return res;
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await registerUser(userData);
      if (res.success && res.token) {
        localStorage.setItem('karigar_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setLoading(false);
        return res;
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout endpoint warning:', err.message);
    } finally {
      localStorage.removeItem('karigar_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
