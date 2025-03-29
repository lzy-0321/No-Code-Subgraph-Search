import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import API_ENDPOINTS from '../services/apiConfig';

const UserMenu = ({ user }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  // 点击头像，切换菜单显示状态
  const handleAvatarClick = (e) => {
    e.stopPropagation();
    setMenuVisible((prevVisible) => !prevVisible);
  };

  // 点击页面其他地方时隐藏菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuVisible) setMenuVisible(false);
    };

    // 添加全局点击事件监听器
    document.addEventListener('click', handleClickOutside);

    // 组件卸载时清理事件监听器
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuVisible]);

  // 处理登出
  const handleLogout = async () => {
    const res = await fetch(API_ENDPOINTS.logout, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (data.success) {
      // 清除用户状态，并跳转到首页
      router.push('/');
    } else {
      alert('Logout failed: ' + data.error);
    }
  };

  return (
    <div className="userAvatarBox" onClick={handleAvatarClick}>
      <span className="userName">{user.username}</span>
      {menuVisible && (
        <div className="userMenu" id="userMenu">
          <ul>
            <li onClick={() => router.push('/profile')}>Profile</li>
            <li onClick={() => router.push('/settings')}>Settings</li>
            <li onClick={handleLogout}>Log Out</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
