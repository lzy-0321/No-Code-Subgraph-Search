import apiService from './apiService';
import API_ENDPOINTS from './apiConfig';

// 数据库API
export const databaseAPI = {
  getUserDatabases: () => apiService.get(API_ENDPOINTS.getUserDatabases),
  selectDatabase: (url) => apiService.post(API_ENDPOINTS.selectDatabase, { selectedUrl: url }),
  getDatabaseInfo: () => apiService.get(API_ENDPOINTS.getDatabaseInfo),
  getNodeEntities: (label) => apiService.post(API_ENDPOINTS.getNodeEntities, { label }),
  getRelationshipEntities: (type) => apiService.post(API_ENDPOINTS.getRelationshipEntities, { type }),
  // ...其他数据库相关API
};

// 用户API
export const userAPI = {
  register: (username, password) => apiService.post(API_ENDPOINTS.register, { username, password }),
  login: (username, password) => apiService.post(API_ENDPOINTS.login, { username, password }),
  refreshToken: (refresh) => apiService.post(API_ENDPOINTS.refresh, { refresh }),
  // ...其他用户相关API
}; 