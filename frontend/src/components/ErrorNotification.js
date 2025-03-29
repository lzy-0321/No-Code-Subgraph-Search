import React, { useEffect, useState } from 'react';
import styles from '../styles/ErrorNotification.module.css';

const ErrorNotification = ({ message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 300); // 等待淡出动画完成
      }, duration); // 通知显示时间
      
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (!message) return null;

  return (
    <div 
      className={`${styles.notificationContainer} ${isVisible ? styles.visible : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.notification}>
        <div className={styles.icon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FF453A" strokeWidth="2" />
            <path d="M12 8V12" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="#FF453A" />
          </svg>
        </div>
        <div className={styles.message}>{message}</div>
        <button className={styles.closeButton} onClick={handleClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="#86868B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6L18 18" stroke="#86868B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={styles.progressBarContainer}>
          <div 
            className={`${styles.progressBar} ${isPaused ? styles.paused : ''}`}
            style={{ animationDuration: `${duration}ms` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification; 