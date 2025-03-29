// API配置文件

const API_ENDPOINTS = {
  // JWT相关端点
  login: '/api/token/',
  refresh: '/api/token/refresh/',
  register: '/api/register/',
  userInfo: '/api/user/info/',  // 新增用户信息端点
  
  // 数据库管理端点
  getUserDatabases: '/api/databases/',  // 更新为RESTful风格
  selectDatabase: '/api/database/select/',
  getDatabaseInfo: '/api/database/info/',
  getNodeEntities: '/api/database/nodes/',
  getRelationshipEntities: '/api/database/relationships/',
  deleteDatabase: '/api/database/delete/',
  addDatabase: '/api/database/add/',
  matchQuery: '/api/database/query/',
};

export default API_ENDPOINTS; 