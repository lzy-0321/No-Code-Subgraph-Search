import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Page1.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const getCsrfToken = () => {
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/);
    return csrfToken ? csrfToken[1] : '';
  };

  const handleLogin = async (e) => {
    e.preventDefault();  // 阻止默认表单提交

    try {
        const res = await fetch('http://localhost:8000/test_neo4j_and_login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),  // 获取并传递 CSRF Token
            },
            body: JSON.stringify({
                username: username,
                password: password,
                rememberMe: rememberMe
            }),
            credentials: 'include',  // 关键：确保 Cookies 被传递到后端
        });

        const data = await res.json();

        if (data.success) {
            // alert('Login successful!');
            window.location.href = '/playground';  // 登录成功后重定向
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again later.');
    }
  };

  return (
    <div id="loginForm" className={styles['tab-content active']}>
      <form id="loginFormSubmit" onSubmit={handleLogin}>
        <div className={styles['input-group']}>
          <label htmlFor="loginUsername">Username</label>
          <input
            type="text"
            id="loginUsername"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className={styles['input-group']}>
          <label htmlFor="loginPassword">Password</label>
          <input
            type="password"
            id="loginPassword"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className={styles['remember-me']}>
          <input
            type="checkbox"
            id="loginRememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="loginRememberMe">Remember Me For 30 Days</label>
        </div>
        <button type="submit" className={styles['submit-btn']}>Log In</button>
      </form>
    </div>
  );
}
