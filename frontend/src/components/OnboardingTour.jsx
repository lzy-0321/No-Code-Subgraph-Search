import { useState, useEffect, useRef } from 'react';
import styles from '../styles/onboardingTour.module.css';

const OnboardingTour = ({ isFirstVisit, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [mounted, setMounted] = useState(false);

  const steps = [
    {
      target: 'center',
      content: 'Welcome to SMARTD STUDIO! A powerful graph database visualization tool.',
      position: 'center'
    },
    {
      target: '[data-tour="feature-box"]',
      content: 'This is the feature area, containing all database operation tools.',
      position: 'right'
    },
    {
      target: '[data-tour="database-manager"]',
      content: 'Connect and manage your databases here.',
      position: 'right'
    },
    {
      target: '[data-tour="search-box"]',
      content: 'Use the search box to quickly find nodes, relationships, and properties.',
      position: 'right'
    },
    {
      target: '[data-tour="graph-info"]',
      content: 'View statistics about nodes and relationships in your current graph.',
      position: 'right'
    },
    {
      target: '[data-tour="data-explorer"]',
      content: 'This is the data explorer area where you can view and manage node labels, relationship types, and property keys. Click each section to expand for details.',
      position: 'right'
    },
    {
      target: '[data-tour="tab-system"]',
      content: 'This is the tab system. You can work with different graph data simultaneously in multiple tabs. Click the + button to create a new tab.',
      position: 'bottom'
    },
    {
      target: '[data-tour="graph-area"]',
      content: 'This is the graph visualization area where you can see your data relationships.',
      position: 'left'
    },
    {
      target: '[data-tour="filter-button"]',
      content: 'Use filters to show/hide specific relationship types and view detailed node properties.',
      position: 'top'
    },
    {
      target: '[data-tour="add-query"]',
      content: 'Click here to add new queries, including node queries, relationship queries, and path queries.',
      position: 'top'
    },
    {
      target: '[data-tour="clear-button"]',
      content: 'Clear all nodes and relationships from the current graph.',
      position: 'top'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      if (onComplete) onComplete();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  // 确保组件已挂载
  useEffect(() => {
    // 延迟设置 mounted 状态，确保 DOM 已完全加载
    const timer = setTimeout(() => {
      setMounted(true);
      //console.log('Component mounted');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 处理位置更新
  useEffect(() => {
    if (!mounted || !isVisible) return;

    const updatePosition = () => {
      const currentStepData = steps[currentStep];
      
      if (currentStepData.target === 'center') {
        setTooltipPosition({
          spotlight: {
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            zIndex: 100000,
            background: 'rgba(0, 0, 0, 0.5)', // 统一的半透明背景
            pointerEvents: 'none'
          },
          tooltip: {
            position: 'fixed',
            top: '50%',
            left: '50%'
          }
        });
        return;
      }

      const targetElement = document.querySelector(currentStepData.target);
      
      if (targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const position = getPositionStyle(targetRect, currentStepData.position);

        // 为特定按钮和 feature-box 增加选中框大小
        let spotlightPadding = { top: 0, right: 0, bottom: 0, left: 0 };
        const target = currentStepData.target;

        if (target === '[data-tour="feature-box"]') {
          // 为 feature-box 设置固定尺寸的选中框
          const featureBoxRect = {
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            // 使用固定高度或计算最大可能高度
            height: window.innerHeight * 0.8 // 使用视窗高度的 80% 作为固定高度
          };

          setTooltipPosition({
            spotlight: {
              top: featureBoxRect.top,
              left: featureBoxRect.left,
              width: featureBoxRect.width,
              height: featureBoxRect.height,
              position: 'fixed',
              zIndex: 100000,
              background: 'transparent',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
              pointerEvents: 'none'
            },
            tooltip: {
              position: 'fixed',
              ...position
            }
          });
          return;
        }

        // 其他元素的处理保持不变
        if (target === '[data-tour="filter-button"]' || 
            target === '[data-tour="add-query"]' || 
            target === '[data-tour="clear-button"]') {
          spotlightPadding = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
          };
        }

        setTooltipPosition({
          spotlight: {
            top: targetRect.top - spotlightPadding.top,
            left: targetRect.left - spotlightPadding.left,
            width: targetRect.width + spotlightPadding.left + spotlightPadding.right,
            height: targetRect.height + spotlightPadding.top + spotlightPadding.bottom,
            position: 'fixed',
            zIndex: 100000,
            background: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            pointerEvents: 'none'
          },
          tooltip: {
            position: 'fixed',
            ...position
          }
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, mounted, isVisible]);

  useEffect(() => {
    if (!isFirstVisit) {
      setIsVisible(false);
    }
  }, [isFirstVisit]);

  // 添加调试日志
  //console.log('OnboardingTour rendered with isFirstVisit:', isFirstVisit);
  //console.log('Current mounted state:', mounted);
  //console.log('Current isVisible state:', isVisible);
  //console.log('Current tooltipPosition:', tooltipPosition);

  if (!isVisible || !mounted || !tooltipPosition) {
    // console.log('Component not rendering due to:', {
    //   isVisible,
    //   mounted,
    //   hasTooltipPosition: !!tooltipPosition
    // });
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <div className={styles.tourOverlay}>
      {tooltipPosition.spotlight && (
        <div 
          className={styles.spotlight} 
          style={{
            ...tooltipPosition.spotlight,
            background: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
          data-target={currentStepData.target.replace('[data-tour="', '').replace('"]', '')}
        />
      )}
      <div 
        className={styles.tooltip} 
        style={{
          ...tooltipPosition.tooltip,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        data-position={currentStepData.position}
        data-target={currentStepData.target.replace('[data-tour="', '').replace('"]', '')}
      >
        <p>{currentStepData.content}</p>
        <div className={styles.tooltipButtons}>
          <button onClick={handleSkip}>Skip</button>
          <button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
        <div className={styles.stepIndicator}>
          {currentStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
};

function getPositionStyle(targetRect, position) {
  if (position === 'center') {
    return {
      top: '50%',
      left: '50%'
    };
  }

  if (!targetRect) return {};

  const margin = 20;
  // 为 graph-area 特别调整提示框宽度
  const tooltipWidth = targetRect.width > window.innerWidth / 2 ? 250 : 300; // 如果目标元素较大，使用更小的提示框
  const tooltipHeight = 150;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 基础位置计算
  let basePosition = {};
  
  switch (position) {
    case 'top':
      basePosition = {
        bottom: windowHeight - targetRect.top + margin,
        left: targetRect.left + (targetRect.width / 2)
      };
      break;
    case 'bottom':
      basePosition = {
        top: targetRect.bottom + margin,
        left: targetRect.left + (targetRect.width / 2)
      };
      break;
    case 'left':
      basePosition = {
        top: targetRect.top + (targetRect.height / 2),
        // 为左侧位置特别调整
        left: Math.max(margin, targetRect.left - tooltipWidth - margin)
      };
      break;
    case 'right':
      basePosition = {
        top: targetRect.top + (targetRect.height / 2),
        // 为右侧位置特别调整
        left: Math.min(windowWidth - tooltipWidth - margin, targetRect.right + margin)
      };
      break;
    default:
      basePosition = {
        top: targetRect.bottom + margin,
        left: targetRect.left + (targetRect.width / 2)
      };
  }

  // 边界检查和调整
  if (basePosition.left) {
    // 检查左边界
    if (basePosition.left < margin) {
      basePosition.left = margin;
    }
    // 检查右边界
    if (basePosition.left + tooltipWidth > windowWidth - margin) {
      basePosition.left = windowWidth - tooltipWidth - margin;
    }
  }

  if (basePosition.top) {
    // 检查上边界
    if (basePosition.top < margin) {
      basePosition.top = margin;
    }
    // 检查下边界
    if (basePosition.top + tooltipHeight > windowHeight - margin) {
      basePosition.top = windowHeight - tooltipHeight - margin;
    }
  }

  return basePosition;
}

export default OnboardingTour; 