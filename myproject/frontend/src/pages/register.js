import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Page1.module.css';

export default function Register() {
  const [protocol, setProtocol] = useState('bolt://');
  const [url, setUrl] = useState('');
  const [serverUser, setServerUser] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    const fullUrl = protocol + url;

    const res = await fetch('http://localhost:8000/test_neo4j_and_signup/', {
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
            <select id="registerProtocol" value={protocol} onChange={(e) => setProtocol(e.target.value)}>
              <option value="neo4j://">neo4j://</option>
              <option value="bolt://">bolt://</option>
              <option value="neo4j+s://">neo4j+s://</option>
              <option value="bolt+s://">bolt+s://</option>
            </select>
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
