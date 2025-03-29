import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Page1.module.css';
import authService from '../services/authService';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.login(username, password, rememberMe);
      router.push('/playground');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed, please check the user name and password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="loginForm" className={styles['tab-content active']}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <form id="loginFormSubmit" onSubmit={handleLogin}>
        <div className={styles['input-group']}>
          <label htmlFor="loginUsername">Username</label>
          <input
            type="text"
            id="loginUsername"
            placeholder="Please enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className={styles['input-group']}>
          <label htmlFor="loginPassword">Password</label>
          <input
            type="password"
            id="loginPassword"
            placeholder="Please enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles['remember-me']}>
          <input
            type="checkbox"
            id="loginRememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="loginRememberMe">Remember me for 30 days</label>
        </div>
        <button 
          type="submit" 
          className={styles['submit-btn']} 
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
