import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Page1.module.css';
import authService from '../services/authService';  // 导入authService
import ErrorNotification from './ErrorNotification';

export default function Register() {
  const [protocol, setProtocol] = useState('bolt://');
  const [isCustomProtocol, setIsCustomProtocol] = useState(false);
  const [customProtocol, setCustomProtocol] = useState('');
  const [url, setUrl] = useState('');
  const [serverUser, setServerUser] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleProtocolChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomProtocol(true);
      setProtocol('');
    } else {
      setIsCustomProtocol(false);
      setProtocol(value);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fullUrl = isCustomProtocol ? customProtocol + url : protocol + url;

    try {
      // 使用authService进行注册
      const response = await authService.register(
        username, 
        password, 
        fullUrl, 
        serverUser, 
        serverPassword
      );
      
      // 注册成功后自动登录
      if (response.access) {
        // 存储用户信息
        localStorage.setItem('user', JSON.stringify(response));
        
        // 跳转到playground页面
        router.push('/playground');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="registerForm" className={styles['tab-content active']}>
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}
      <form id="registerFormSubmit" onSubmit={handleRegister}>
        <div className={styles['input-group']}>
          <label htmlFor="registerProtocol">Connect URL</label>
          <div className={styles['input-flex']}>
            <select 
              id="registerProtocol" 
              value={isCustomProtocol ? 'custom' : protocol} 
              onChange={handleProtocolChange}
            >
              <option value="neo4j://">neo4j://</option>
              <option value="bolt://">bolt://</option>
              <option value="neo4j+s://">neo4j+s://</option>
              <option value="bolt+s://">bolt+s://</option>
              <option value="custom">Custom</option>
            </select>
            {isCustomProtocol && (
              <input
                type="text"
                id="customProtocol"
                placeholder="Custom protocol"
                value={customProtocol}
                onChange={(e) => setCustomProtocol(e.target.value)}
                style={{marginRight: '5px'}}
              />
            )}
            <input
              type="text"
              id="registerConnectUrl"
              placeholder="192.168.0.54:7687"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        </div>
        <div className={styles['input-group']}>
          <label htmlFor="registerServerUsername">Server username</label>
          <input
            type="text"
            id="registerServerUsername"
            placeholder="Enter server username"
            value={serverUser}
            onChange={(e) => setServerUser(e.target.value)}
            required
          />
        </div>
        <div className={styles['input-group']}>
          <label htmlFor="registerServerPassword">Server password</label>
          <input
            type="password"
            id="registerServerPassword"
            placeholder="Enter server password"
            value={serverPassword}
            onChange={(e) => setServerPassword(e.target.value)}
          />
        </div>
        <div className={styles['input-group']}>
          <label htmlFor="registerUsername">Username</label>
          <input
            type="text"
            id="registerUsername"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className={styles['input-group']}>
          <label htmlFor="registerPassword">Password</label>
          <input
            type="password"
            id="registerPassword"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles['remember-me']}>
          <input
            type="checkbox"
            id="registerRememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="registerRememberMe">Remember me for 30 days</label>
        </div>
        <button 
          type="submit" 
          className={styles['submit-btn']} 
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
