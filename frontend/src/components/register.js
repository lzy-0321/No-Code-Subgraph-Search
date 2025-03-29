import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Page1.module.css';
import API_ENDPOINTS from '../config/apiConfig';

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

    const fullUrl = isCustomProtocol ? customProtocol + url : protocol + url;

    const res = await fetch(API_ENDPOINTS.register, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()  // 获取 CSRF Token
      },
      body: JSON.stringify({
        fullUrl: fullUrl,
        serverUser: serverUser,
        serverPassword: serverPassword,
        username: username,
        password: password
      }),
      credentials: 'include',  // 关键：确保 Cookies 被传递到后端
    });

    const data = await res.json();

    if (data.success) {
      // 注册成功，跳转到 playground 页面
      alert('Registration successful!');
      router.push('/playground');
    } else {
      setError(data.error);  // 显示错误消息
      alert(`Registration failed: ${data.error}`);
    }
  };

  const getCsrfToken = () => {
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/);
    return csrfToken ? csrfToken[1] : '';
  };

  return (
    <div id="registerForm" className={styles['tab-content active']}>
      <form id="registerFormSubmit" onSubmit={handleRegister}>
      <div className={styles['input-group']}>
          <label htmlFor="registerProtocol">Connect URL</label>
          <div className={styles['input-flex']}>
            <select id="registerProtocol" value={isCustomProtocol ? 'custom' : protocol} onChange={handleProtocolChange}>
              <option value="neo4j://">neo4j://</option>
              <option value="bolt://">bolt://</option>
              <option value="neo4j+s://">neo4j+s://</option>
              <option value="bolt+s://">bolt+s://</option>
              <option value="custom">custom</option>
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
          <label htmlFor="registerServerUsername">Server Username</label>
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
          <label htmlFor="registerServerPassword">Server Password</label>
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
          <label htmlFor="registerRememberMe">Remember Me For 30 Days</label>
        </div>
        <button type="submit" className={styles['submit-btn']}>Log In</button>
      </form>
    </div>
  );
}
