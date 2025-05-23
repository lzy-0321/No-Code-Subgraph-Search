import React, { useRef, useEffect, useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';

const DrawGraph = ({ nodes, relationships, enableZoom = true, useNormalCanvas = false, resetKey }) => {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [viewTransform, setViewTransform] = useState({
    x: 0,
    y: 0,
    scale: 1
  });

  //console.log('GraphComponent rendered');
  //console.log('Nodes:', nodes);
  //console.log('Relationships:', relationships);

  useEffect(() => {
    return () => {
        graphRef.current = null; // 清理 ref
    };
  }, []);

  // 定义颜色映射函数
  const getNodeColor = (node) => {
    if (!node || !node.nodeLabel) return '#E5E5EA'; // iOS 浅灰色背景色

    // 使用节点的 nodeLabel
    const nodeLabel = node.nodeLabel || '';
    let hash = 0;
    for (let i = 0; i < nodeLabel.length; i++) {
      hash = nodeLabel.charCodeAt(i) + ((hash << 5) - hash);
    }

    // 高对比度的柔和配色方案
    const colorPalette = [
      '#7EB0D5', // 柔和的蓝色
      '#95B47B', // 柔和的绿色
      '#C3797B', // 柔和的红色
      '#B595CF', // 柔和的紫色
      '#E4C17B', // 柔和的黄色
      '#79B4B7'  // 柔和的青色
    ];

    // 使用哈希值选择颜色
    const index = Math.abs(hash) % colorPalette.length;
    return colorPalette[index];
  };

  const priorityProperties = ["name", "title", "id"];

  // 获取节点的优先属性
  const getPriorityProperty = (properties) => {
    if (!properties) return '';
    const selectedProperty = priorityProperties.find((prop) => properties[prop]);
    return selectedProperty ? properties[selectedProperty] : Object.values(properties)[0];
  };

  const data = React.useMemo(
    () => ({
      nodes: nodes.map((node) => ({
        id: node.id,
        nodeLabel: node.nodeLabel,
        displayLabel: getPriorityProperty(node.properties), // 用于显示的 label
        properties: node.properties,
      })),
      links: relationships.map((rel) => ({
        source: rel.startNode,
        target: rel.endNode,
        type: rel.type,
        properties: rel.properties,
      })),
    }),
    [nodes, relationships]
  );

  useEffect(() => {
    //console.log('Graph data updated');
  }, [data]);

  // 处理鼠标按下
  const handleMouseDown = (e) => {
    if (e.button === 0) { // 只响应左键
      setIsDragging(true);
      setStartPos({
        x: e.clientX - viewTransform.x,
        y: e.clientY - viewTransform.y
      });
      // 添加 grabbing 光标样式
      document.body.style.cursor = 'grabbing';
    }
  };

  // 处理鼠标移动
  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - startPos.x;
      const newY = e.clientY - startPos.y;
      setViewTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    }
  };

  // 处理鼠标松开
  const handleMouseUp = () => {
    setIsDragging(false);
    // 恢复默认光标样式
    document.body.style.cursor = 'default';
  };

  // 处理滚轮缩放
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY;
    const scaleFactor = 1 - delta / 1000;
    const newScale = Math.min(Math.max(0.1, viewTransform.scale * scaleFactor), 3);
    
    // 计算以鼠标位置为中心的缩放
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newX = mouseX - (mouseX - viewTransform.x) * (newScale / viewTransform.scale);
    const newY = mouseY - (mouseY - viewTransform.y) * (newScale / viewTransform.scale);

    setViewTransform({
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [viewTransform]);

  // 根据 useNormalCanvas 属性决定画布大小和初始位置
  const CANVAS_SIZE = {
    width: useNormalCanvas ? 800 : window.innerWidth * 3,  // 使用固定宽度
    height: useNormalCanvas ? 700 : window.innerHeight * 3 // 使用固定高度
  };

  // 初始化视图位置到中心
  useEffect(() => {
    if (useNormalCanvas) {
      // homepage 的初始位置
      setViewTransform({
        x: 0,
        y: 0,
        scale: 1
      });
    } else {
      // playground 的初始位置
      setViewTransform({
        x: -CANVAS_SIZE.width / 3,
        y: -CANVAS_SIZE.height / 3,
        scale: 1
      });
    }
  }, [useNormalCanvas, resetKey]);

  // 监听数据变化，当节点和关系都为空时重置画布位置
  useEffect(() => {
    if (nodes.length === 0 && relationships.length === 0) {
      if (useNormalCanvas) {
        setViewTransform({
          x: 0,
          y: 0,
          scale: 1
        });
      } else {
        setViewTransform({
          x: -CANVAS_SIZE.width / 3,
          y: -CANVAS_SIZE.height / 3,
          scale: 1
        });
      }
    }
  }, [nodes.length, relationships.length, useNormalCanvas]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 图形渲染层 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CANVAS_SIZE.width,
          height: CANVAS_SIZE.height,
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease'
        }}
      >
        <ForceGraph2D
          ref={graphRef}
          width={CANVAS_SIZE.width}
          height={CANVAS_SIZE.height}
          graphData={data}
          centerAt={useNormalCanvas ? [CANVAS_SIZE.width / 2, CANVAS_SIZE.height / 2] : undefined}
          enableZoomInteraction={enableZoom}
          enablePanInteraction={false}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.displayLabel;
            const nodeRadius = 15;
            const fillColor = getNodeColor(node);

            // 绘制节点圆圈
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = fillColor;
            ctx.fill();

            // 文字渲染
            const lines = label.split(' ');
            const maxLineWidth = nodeRadius * 1.6; // 减小最大宽度，确保有足够边距
            
            // 计算初始字体大小
            let fontSize = Math.min(12 / globalScale, nodeRadius * 0.8); // 减小初始字体大小
            ctx.font = `${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';

            // 检查并调整字体大小，确保文字适合节点
            let textFits = false;
            while (!textFits && fontSize > 3) {
              ctx.font = `${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
              
              // 计算所有行的最大宽度
              const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
              
              // 计算文本总高度
              const lineHeight = fontSize * 1.1; // 减小行高
              const totalHeight = lineHeight * lines.length;
              
              // 检查文本是否适合圆圈（考虑宽度和高度）
              if (maxWidth <= maxLineWidth && totalHeight <= nodeRadius * 1.8) {
                textFits = true;
              } else {
                fontSize *= 0.9;
              }
            }

            // 计算最终的行高和总高度
            const lineHeight = fontSize * 1.1;
            const totalHeight = lineHeight * lines.length;
            const startY = node.y - (totalHeight / 2) + (lineHeight / 2);

            // 绘制文本
            lines.forEach((line, index) => {
              // 如果文本太长，添加省略号
              let displayText = line;
              let textWidth = ctx.measureText(displayText).width;
              
              // 确保即使加上省略号也不会超出
              while (textWidth > maxLineWidth && displayText.length > 0) {
                displayText = displayText.slice(0, -1);
                if (displayText.length > 0) {
                  displayText += '…';
                  textWidth = ctx.measureText(displayText).width;
                }
              }
              
              if (displayText.length > 0) {
                ctx.fillText(
                  displayText,
                  node.x,
                  startY + (index * lineHeight)
                );
              }
            });
          }}
          nodeLabel={(node) => {
            const props = Object.entries(node.properties)
              .map(([key, value]) => `<strong>${key}</strong>: ${value}`)
              .join('<br />');
            return `<div style="text-align: left;">${props}</div>`;
          }}
          linkCanvasObject={(link, ctx, globalScale) => {
            const fontSize = Math.min(14 / globalScale, 8);
            const curvature = 0.2;
            const nodeRadius = 15;
            
            // 使用更粗的线条
            const lineWidth = Math.min(2 / globalScale, 1.2);
            
            // 优化的颜色方案
            const lineColor = '#A0AEC0';  // 更深的线条颜色
            const arrowColor = '#718096';  // 更深的箭头颜色
            const textColor = '#2D3748';   // 更深的文字颜色
            const bgColor = 'rgba(255, 255, 255, 0.95)'; // 更不透明的背景

            // 计算控制点
            const controlX = (link.source.x + link.target.x) / 2 + curvature * (link.target.y - link.source.y);
            const controlY = (link.source.y + link.target.y) / 2 - curvature * (link.target.x - link.source.x);

            // 绘制连接线（曲线）
            ctx.beginPath();
            ctx.moveTo(link.source.x, link.source.y);
            ctx.quadraticCurveTo(controlX, controlY, link.target.x, link.target.y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
            
            // 增强阴影效果
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
            
            ctx.stroke();
            ctx.shadowColor = 'transparent';

            // 优化箭头尺寸和位置
            const arrowLength = Math.min(12 / globalScale, 8);  // 增大箭头
            const arrowWidth = Math.min(8 / globalScale, 6);    // 增大箭头宽度
            const arrowDistance = nodeRadius + lineWidth;

            // 计算箭头位置
            const tEnd = 1;
            const endX = (1 - tEnd) * (1 - tEnd) * link.source.x +
                        2 * (1 - tEnd) * tEnd * controlX +
                        tEnd * tEnd * link.target.x;
            const endY = (1 - tEnd) * (1 - tEnd) * link.source.y +
                        2 * (1 - tEnd) * tEnd * controlY +
                        tEnd * tEnd * link.target.y;

            const tangentEndX = 2 * (1 - tEnd) * (controlX - link.source.x) + 2 * tEnd * (link.target.x - controlX);
            const tangentEndY = 2 * (1 - tEnd) * (controlY - link.source.y) + 2 * tEnd * (link.target.y - controlY);
            const lineLength = Math.sqrt(tangentEndX * tangentEndX + tangentEndY * tangentEndY);
            const endAngle = Math.atan2(tangentEndY, tangentEndX);

            const arrowTipX = endX - arrowDistance * (tangentEndX / lineLength);
            const arrowTipY = endY - arrowDistance * (tangentEndY / lineLength);
            const arrowCenterX = arrowTipX - (arrowLength / 2) * (tangentEndX / lineLength);
            const arrowCenterY = arrowTipY - (arrowLength / 2) * (tangentEndY / lineLength);

            // 绘制增强的箭头
            ctx.save();
            ctx.translate(arrowCenterX, arrowCenterY);
            ctx.rotate(endAngle);
            
            // 绘制箭头轮廓
            ctx.beginPath();
            ctx.moveTo(arrowLength / 2, 0);
            ctx.lineTo(-arrowLength / 2, arrowWidth / 2);
            ctx.lineTo(-arrowLength / 3, 0);  // 添加一个中间点使箭头更立体
            ctx.lineTo(-arrowLength / 2, -arrowWidth / 2);
            ctx.closePath();
            
            // 添加箭头阴影
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillStyle = arrowColor;
            ctx.fill();
            ctx.restore();

            // 绘制关系类型文本
            const text = link.type;
            const t = 0.5;
            const midX = (1 - t) * (1 - t) * link.source.x +
                        2 * (1 - t) * t * controlX +
                        t * t * link.target.x;
            const midY = (1 - t) * (1 - t) * link.source.y +
                        2 * (1 - t) * t * controlY +
                        t * t * link.target.y;

            const tangentX = 2 * (1 - t) * (controlX - link.source.x) + 2 * t * (link.target.x - controlX);
            const tangentY = 2 * (1 - t) * (controlY - link.source.y) + 2 * t * (link.target.y - controlY);
            const angle = Math.atan2(tangentY, tangentX);

            // 绘制增强的文本背景
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);
            ctx.font = `${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
            const textWidth = ctx.measureText(text).width;
            const padding = 6;  // 增加内边距
            const borderRadius = 3;  // 添加圆角

            // 绘制圆角背景
            ctx.fillStyle = bgColor;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
            
            const boxWidth = textWidth + padding * 2;
            const boxHeight = fontSize + padding * 2;
            const x = -boxWidth / 2;
            const y = -boxHeight / 2;
            
            // 绘制圆角矩形
            ctx.beginPath();
            ctx.moveTo(x + borderRadius, y);
            ctx.lineTo(x + boxWidth - borderRadius, y);
            ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + borderRadius);
            ctx.lineTo(x + boxWidth, y + boxHeight - borderRadius);
            ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - borderRadius, y + boxHeight);
            ctx.lineTo(x + borderRadius, y + boxHeight);
            ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - borderRadius);
            ctx.lineTo(x, y + borderRadius);
            ctx.quadraticCurveTo(x, y, x + borderRadius, y);
            ctx.closePath();
            ctx.fill();

            // 绘制文本
            ctx.shadowColor = 'transparent';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.fillText(text, 0, 0);
            ctx.restore();

            link.__labelX = midX;
            link.__labelY = midY;
          }}
          linkCurvature={0.2}
          linkLabel={(link) => {
            // 设置位置信息与link.type显示的位置一致
            const props = Object.entries(link.properties)
              .map(([key, value]) => `<strong>${key}</strong>: ${value}`)
              .join('<br />');
            return `<div style="text-align: left;">Type: <strong>${link.type}</strong><br />${props}</div>`;
          }}
          // linkDirectionalArrowLength={8}
          // linkDirectionalArrowRelPos={0.5}
          // linkCurvature={0.2}
          onNodeDragEnd={(node) => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          // 设置力导向图参数
          d3Force="charge"
          d3VelocityDecay={0.9}
          d3AlphaDecay={0.02}
          onEngineTick={() => {
            if (graphRef.current) {
              const chargeForce = graphRef.current.d3Force('charge');
              const linkForce = graphRef.current.d3Force('link');
              if (chargeForce) chargeForce.strength(-800); // 增强节点间的排斥力
              if (linkForce) linkForce.distance(200); // 设置节点之间的距离
            }
          }}
          onNodeClick={(node, event) => {
            // 仅阻止默认交互，不移动整个图形
            event.stopPropagation();
          }}
          onLinkClick={(link, event) => {
            // 仅阻止默认交互，不移动整个图形
            event.stopPropagation();
          }}
          onNodeDragStart={() => {
            // 节点拖动时禁用画布拖动
            setIsDragging(false);
            document.body.style.cursor = 'default';
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const nodeRadius = 15;
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
          }}
        />
      </div>
    </div>
  );
};

export default DrawGraph;
