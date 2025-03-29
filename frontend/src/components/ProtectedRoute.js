import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import authService from '../services/authService';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const user = authService.getCurrentUser();
      
      if (!user || !user.access) {
        // 未登录，重定向到登录页面
        router.push('/'); // 假设主页是登录页面或有登录选项
      } else {
        // 已登录，但检查令牌是否过期
        try {
          await authService.refreshToken();
          setLoading(false);
        } catch (error) {
          // 令牌无效，重定向到登录页面
          router.push('/');
        }
      }
    };
    
    checkAuth();
  }, [router]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return children;
};

export default ProtectedRoute; 