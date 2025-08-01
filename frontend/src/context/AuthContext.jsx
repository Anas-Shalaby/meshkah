import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check token validity and expiry
  const checkTokenValidity = () => {
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");

    if (!token || !tokenExpiry) {
      logout();
      return false;
    }

    const expiryDate = new Date(tokenExpiry);
    const now = new Date();

    if (now > expiryDate) {
      logout();
      return false;
    }

    return true;
  };

  // Check token on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");

    if (!token || !tokenExpiry) {
      logout();
      setLoading(false);
    } else if (checkTokenValidity()) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/profile`,
        {
          headers: { "x-auth-token": token },
        }
      );
      setUser(response.data);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      logout();
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password }
      );
      return handleLoginResponse(response.data);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.msg || "خطأ في تسجيل الدخول",
      };
    }
  };

  const googleLogin = async (token) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/google-login`,
        { token }
      );
      return handleLoginResponse(response.data);
    } catch (error) {
      console.error(
        "Google Login Error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: "فشل تسجيل الدخول عبر جوجل",
      };
    }
  };

  const handleLoginResponse = (data) => {
    // Set token and expiry (1 hour from now)
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000 * 24 * 7); // 7 days
    localStorage.setItem("token", data.token);
    localStorage.setItem("tokenExpiry", expiryTime.toISOString());

    // Set user in context
    setUser(data.user);
    setIsAuthenticated(true);

    return { success: true };
  };

  const updateUser = (userData) => {
    setUser(userData);
    setIsAuthenticated(!!userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        { username, email, password }
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.msg || "خطأ في التسجيل",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        googleLogin,
        register,
        logout,
        setUser: updateUser,
        checkTokenValidity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
