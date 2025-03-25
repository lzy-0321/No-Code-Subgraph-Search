// API配置文件
const API_BASE_URL = 'http://localhost:8000';

const API_ENDPOINTS = {
  login: `${API_BASE_URL}/test_neo4j_and_login/`,
  register: `${API_BASE_URL}/test_neo4j_and_signup/`,
  logout: `${API_BASE_URL}/logout/`,
  selectDatabase: `${API_BASE_URL}/select_database/`,
  getDatabaseInfo: `${API_BASE_URL}/get_database_info`,
  getUserDatabases: `${API_BASE_URL}/get_user_databases/`,
  getNodeEntities: `${API_BASE_URL}/get_nodeEntities/`,
  getRelationshipEntities: `${API_BASE_URL}/get_relationshipEntities/`,
  deleteDatabase: `${API_BASE_URL}/delete_database/`,
  addDatabase: `${API_BASE_URL}/add_database/`,
  checkLoginStatus: `${API_BASE_URL}/check_login_status/`,
  matchQuery: `${API_BASE_URL}/match_query/`,
  
  // 在此处可以添加其他API端点
};

export default API_ENDPOINTS; 