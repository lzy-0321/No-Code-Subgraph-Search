import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Login from '../components/login';  // 导入登录组件
import Register from '../components/register';  // 导入注册组件
import styles from '../styles/Page1.module.css';
import dynamic from 'next/dynamic';
import { TutorialCard } from '../components/tutorialCard';  // 更新导入
import PulsatingButton from "../components/ui/pulsating-button";
import BoxReveal from "../components/ui/box-reveal";
import API_ENDPOINTS from '../services/apiConfig';
import authService from '../services/authService';
const DrawGraph = dynamic(() => import('../components/DrawGraph'), { ssr: false });

export default function Home() {
  const [user, setUser] = useState(null);  // 用户状态
  const [menuVisible, setMenuVisible] = useState(false);  // 用户菜单显示状态
  const [authModalVisible, setAuthModalVisible] = useState(false);  // 模态框显示状态
  const [activeForm, setActiveForm] = useState('login');  // 当前激活的表单 ('login' or 'register')
  const router = useRouter();

  const [graphNodes, setGraphNodes] = useState([]);
  const [graphRelationships, setGraphRelationships] = useState([]);

  useEffect(() => {
    // 模拟获取图数据的异步操作
    setTimeout(() => {
      setGraphNodes([
        { id: '1', nodeLabel: 'PERSON', properties: { name: 'Alice', age: 30, role: 'Engineer' } },
        { id: '2', nodeLabel: 'PERSON', properties: { name: 'Bob', age: 25, role: 'Designer' } },
        { id: '3', nodeLabel: 'KNOWLEDGE', properties: { title: 'Graph Database', type: 'Tutorial', category: 'Technology' } },
        { id: '4', nodeLabel: 'PERSON', properties: { name: 'Charlie', age: 35, role: 'Manager' } },
        // { id: '5', nodeLabel: 'PERSON', properties: { name: 'Diana', age: 28, role: 'Researcher' } },
        // { id: '6', nodeLabel: 'KNOWLEDGE', properties: { title: 'Data Science', type: 'Tutorial', category: 'Education' } },
        // { id: '7', nodeLabel: 'PERSON', properties: { name: 'Eve', age: 40, role: 'Director' } },
      ]);
      setGraphRelationships([
        { startNode: '1', endNode: '2', type: 'FRIEND', properties: { since: '2020', frequency: 'Weekly' } },
        { startNode: '2', endNode: '3', type: 'LEARNED', properties: { date: '2021', confidence: 'High' } },
        // { startNode: '1', endNode: '6', type: 'LEARNED', properties: { date: '2019', confidence: 'High' } },
        // { startNode: '1', endNode: '3', type: 'MENTORED', properties: { duration: '6 months', successRate: '90%' } },
        // { startNode: '4', endNode: '5', type: 'COLLABORATED', properties: { project: 'AI Research', duration: '1 year' } },
        // { startNode: '6', endNode: '7', type: 'INSPIRED', properties: { topic: 'Machine Learning', impact: 'Significant' } },
        // { startNode: '4', endNode: '7', type: 'FRIEND', properties: { since: '2019', frequency: 'Monthly' } },
        // { startNode: '3', endNode: '6', type: 'REFERRED', properties: { reason: 'Expertise', trustLevel: 'High' } },
      ]);
    }, 1000);
  }, []);

  const getCsrfToken = () => {
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/);
    return csrfToken ? csrfToken[1] : '';
  };

  // 添加新的JWT认证检查
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (authService.isLoggedIn()) {
        try {
          // 获取用户信息
          const userInfo = await authService.getUserInfo();
          setUser({ username: userInfo.username });
        } catch (error) {
          // 如果获取用户信息失败，清除本地存储
          authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    
    checkAuthStatus();
  }, []);

  // 头像点击时，显示或隐藏用户菜单
  const handleAvatarClick = (e) => {
    e.stopPropagation();
    setMenuVisible((prevVisible) => !prevVisible);  // 切换菜单显示状态
  };

  // 点击页面其他地方时，隐藏菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuVisible) setMenuVisible(false);  // 当菜单显示时，点击页面其他地方隐藏菜单
    };
    document.addEventListener('click', handleClickOutside);  // 添加全局点击事件
    return () => document.removeEventListener('click', handleClickOutside);  // 清除事件监听
  }, [menuVisible]);

  // 修改注销处理函数
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('注销失败:', error);
    }
  };

  const openModal = (formType) => {
    setActiveForm(formType);
    setAuthModalVisible(true);

    // 在模态框渲染完成后使用 id 追踪模态框
    setTimeout(() => {
      const modal = document.getElementById('authModal');
      if (modal) {
        modal.style.display = 'flex';  // 显示模态框
      } else {
        console.error('Modal element not found');
      }
    }, 0);
  };

  const closeModal = () => {
    setAuthModalVisible(false);
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.style.display = 'none';  // 隐藏模态框
    }
  };

  useEffect(() => {
    // 检查 URL hash
    if (window.location.hash) {
      // 给浏览器一点时间来完成初始渲染
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }, []); // 空依赖数组意味着这个效果只在组件挂载时运行一次

  return (
    <div className={styles.page1}>
      {/* 顶部导航部分 */}
      <section className={styles.smartDOverviewSection}>
        <div className={styles.blockContainer}>
          <div className={styles.flexRowContainer}>
            {/* Branding section */}
            <div className={styles.brandingContainer}>
              <Image
                className={styles.brandingImage}
                src="/assets/0fbf1a91f14780ce3fa9a491a86c9449.svg"
                alt="Branding"
                width={24}
                height={24}
              />
              <div className={styles.brandingTextContainer}>
                <p className={styles.brandingNameText}>SMARTD</p>
                <p className={styles.brandingStudioText}>STUDIO</p>
              </div>
            </div>

            {/* Navigation section */}
            <div className={styles.navigationRowContainer}>
              <Link href="/" className={styles.navHomeText}>Home</Link>
              <Link href="/playground" className={styles.navPlaygroundText} id="playgroundLink">Playground</Link>
              <a href="#tutorialsSection" className={styles.navTutorialText}>Tutorial</a>
              <Link href="/about" className={styles.navAboutText}>About</Link>
            </div>

            {/* Authentication buttons section */}
            <div className={styles.authButtonsContainer}>
              {!user ? (
                <>
                  <button className={styles.loginBtn} onClick={() => openModal('login')}>Log In</button>
                  <button className={styles.startTrialBtn} onClick={() => openModal('register')}>Start Free Trial</button>
                </>
              ) : (
                <div className={styles.userAvatarBox} onClick={handleAvatarClick}>
                  <span className={styles.userName}>{user.username}</span>
                  {menuVisible && (
                    <div className={styles.userMenu} id="userMenu" style={{ display: 'block' }}>
                      <button className={styles.logoutBtn} onClick={handleLogout}>Log Out</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 模态框部分 */}
      <div id="authModal" className={`${styles.modal} ${authModalVisible ? styles.visible : ''}`}>
        <div className={styles.modalContent}>
          <div className={styles['header-container']}>
            <div className={styles.tabs}>
              <button
                id="loginTab"
                className={`${styles['tab-button']} ${activeForm === 'login' ? styles.active : ''}`}
                onClick={() => setActiveForm('login')}
              >
                Log In
              </button>
              <button
                id="registerTab"
                className={`${styles['tab-button']} ${activeForm === 'register' ? styles.active : ''}`}
                onClick={() => setActiveForm('register')}
              >
                Sign Up
              </button>
            </div>
            <span id="closeModal" className={styles.closeBtn} onClick={closeModal}>&times;</span>
          </div>

          {activeForm === 'login' && <Login />}
          {activeForm === 'register' && <Register />}
        </div>
      </div>

      {/* No-Code Solutions Section */}
      <section id="noCodeSolutionsSection" className={styles.noCodeSolutionsSection}>
        <div className={styles.solutionsContentRow}>
          <div className={styles.solutionsContentColumn}>
            <div className={styles.contentWrapper}>
              <div className={styles.solutionsHeaderWrapper}>
              <BoxReveal boxColor={"#5046e6"} duration={0.5}>
                <p className="text-[3.5rem] font-semibold">
                  No code solutions for Graph Database
                </p>
              </BoxReveal>
              <BoxReveal boxColor={"#5046e6"} duration={0.5}>
                <h1 className="mt-[.5rem] text-[1rem]">
                Due to the developer shortage and budget issues, low-code/no-code frameworks are gaining popularity.
                Visual Query Interfaces (VQIs) let users create database queries with "drag-and-drop" ease.
                </h1>
              </BoxReveal>
              </div>
            </div>
              <PulsatingButton
                className={styles.linkDatabaseBtn}
                onClick={() => {
                  if (!user) {
                    // 未登录时，打开注册模态框
                    openModal('register');
                  } else {
                    // 登录后，跳转到 playground 页面
                    router.push('/playground');
                  }
                }}
              >
                {user ? 'Go to Playground' : 'Link database'}
              </PulsatingButton>
          </div>
          <div className={styles.graph}>
            <DrawGraph 
              nodes={graphNodes} 
              relationships={graphRelationships}
              width={800}
              height={700}
              enableZoom={true}
              useNormalCanvas={true}
            />
          </div>
        </div>
      </section>

      {/* Tutorials Section */}
      <section id="tutorialsSection" className={styles.tutorialsSection}>
        <div className={styles.tutorialHeaderWrapper}>
          <h3 className={styles.tutorialHeaderText}>Tutorial</h3>
        </div>
        <div className={styles.tutorialContentBox} id="tutorialContentBox">
          <TutorialCard />
        </div>
      </section>

      {/* 页脚部分 */}
      <footer className={styles.footerSection}>
        <div className={styles.footerWrapper}>
          {/* 左侧品牌标识 */}
          <div className={styles.footerBrandingContainer}>
            <Image
              src="/assets/0fbf1a91f14780ce3fa9a491a86c9449.svg"
              alt="SMARTD"
              width={24}
              height={24}
              className={styles.footerBrandingImage}
            />
            <div className={styles.footerBrandingText}>
              <span className={styles.footerBrandingName}>SMARTD</span>
              <span className={styles.footerBrandingStudio}>STUDIO</span>
            </div>
          </div>

          {/* 中间导航链接 */}
          <nav className={styles.footerNavRow}>
            <Link href="/">Home</Link>
            <Link href="/playground">Playground</Link>
            <Link href="/#tutorialsSection">Tutorial</Link>
            <Link href="/about">About</Link>
          </nav>

          {/* 右侧版权信息 */}
          <div className={styles.footerCopyright}>
            © 2024 SMARTD STUDIO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
