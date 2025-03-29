import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

// 从localStorage获取用户函数
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  return null;
};

// 创建axios实例
const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    const user = getCurrentUser();
    if (user && user.access) {
      config.headers['Authorization'] = `Bearer ${user.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加一个本地logout函数
const logout = () => {
  localStorage.removeItem('user');
};

// 响应拦截器 - 处理令牌刷新
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 如果返回401错误且未尝试刷新令牌
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 尝试刷新令牌
        const user = getCurrentUser();
        if (user && user.refresh) {
          try {
            const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
              refresh: user.refresh
            });
            
            if (response.data.access) {
              const updatedUser = {
                ...user,
                access: response.data.access
              };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              // 更新认证头并重试请求
              axios.defaults.headers.common['Authorization'] = `Bearer ${updatedUser.access}`;
              return instance(originalRequest);
            }
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }
      } catch (refreshError) {
        // 如果刷新失败，登出用户
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance; 