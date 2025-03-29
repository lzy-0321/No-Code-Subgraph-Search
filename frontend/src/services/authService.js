import axios from 'axios';
import apiService from './apiService';
import API_ENDPOINTS from './apiConfig';

const authService = {
  login: async (username, password, rememberMe = false) => {
    try {
      const response = await apiService.post(API_ENDPOINTS.login, {
        username,
        password
      });
      
      if (response.data.access) {
        // 存储用户信息和令牌
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // 如果选择"记住我"，在localStorage中存储标记
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: async () => {
    try {
      // 清除本地存储的用户信息
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      
      // JWT认证模式下，前端主动登出不需要调用后端API
      return { success: true };
    } catch (error) {
      console.error('注销时出错:', error);
      throw error;
    }
  },
  
  register: async (username, password, databaseUrl, serverUsername, serverPassword) => {
    try {
      const response = await apiService.post(API_ENDPOINTS.register, {
        username,
        password,
        neo4j_url: databaseUrl,
        neo4j_username: serverUsername,
        neo4j_password: serverPassword
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },
  
  // 检查用户是否已登录
  isLoggedIn: () => {
    return !!localStorage.getItem('user');
  },
  
  // 刷新令牌
  refreshToken: async () => {
    const user = authService.getCurrentUser();
    
    if (user && user.refresh) {
      try {
        const response = await apiService.post(API_ENDPOINTS.refresh, {
          refresh: user.refresh
        });
        
        if (response.data.access) {
          const updatedUser = {
            ...user,
            access: response.data.access
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        }
      } catch (error) {
        authService.logout();
        throw error;
      }
    }
    
    return user;
  },
  
  // 获取用户信息
  getUserInfo: async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.userInfo);
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }
};

export default authService; 