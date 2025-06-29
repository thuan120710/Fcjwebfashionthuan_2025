import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Kiểm tra xem có token trong localStorage không
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  // Đăng nhập
  const login = async (email, password) => {
    try {
      setError(null);
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        `${API_URL}/api/users/login`,
        { email, password },
        config
      );

      // Lưu user info vào localStorage và state
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
      throw error;
    }
  };

  // Đăng nhập với token (sử dụng cho đăng nhập Google)
  const loginWithToken = async (token) => {
    try {
      setError(null);

      // Lưu token trước
      localStorage.setItem("token", token);

      // Lấy thông tin user với token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.get(`${API_URL}/api/auth/current`, config);

      // Tạo userInfo bao gồm token và dữ liệu user
      const userInfo = {
        ...data.user,
        token,
      };

      // Lưu user info vào localStorage và state
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      setUser(userInfo);
    } catch (error) {
      localStorage.removeItem("token");
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
      throw error;
    }
  };

  // Đăng ký
  const register = async (username, email, password, firstName, lastName) => {
    try {
      setError(null);
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        `${API_URL}/api/users`,
        { username, email, password, firstName, lastName },
        config
      );

      // Lưu user info vào localStorage và state
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
      throw error;
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    setUser(null);
  };

  // Cập nhật avatar
  const updateUserAvatar = (avatarPath) => {
    if (user) {
      const updatedUser = { ...user, avatar: avatarPath };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginWithToken,
        register,
        logout,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
