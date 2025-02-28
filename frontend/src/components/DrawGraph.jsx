import React, { useRef, useEffect } from 'react';
import { ForceGraph2D } from 'react-force-graph';

const DrawGraph = ({ nodes, relationships, enableZoom = true }) => {
  const graphRef = useRef();

  console.log('GraphComponent rendered');
  console.log('Nodes:', nodes);
  console.log('Relationships:', relationships);

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
    console.log('Graph data updated');
  }, [data]);

  return (
    <ForceGraph2D
      ref={graphRef}
      enablePanInteraction={false} // 禁用全局拖动
      graphData={data}
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
        const fontSize = 14 / globalScale; // 根据缩放比例调整字体大小
        const curvature = 0.2; // 曲率值，调整连接线的弯曲程度
        const nodeRadius = 15; // 假设节点半径为15
        const lineWidth = 0.8 / globalScale; // 连接线宽度

        // 计算控制点
        const controlX = (link.source.x + link.target.x) / 2 + curvature * (link.target.y - link.source.y);
        const controlY = (link.source.y + link.target.y) / 2 - curvature * (link.target.x - link.source.x);

        // 绘制连接线（曲线）
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y); // 起点
        ctx.quadraticCurveTo(controlX, controlY, link.target.x, link.target.y); // 使用控制点绘制曲线
        ctx.strokeStyle = '#444444'; // 设置连接线颜色
        ctx.lineWidth = lineWidth; // 设置线宽
        ctx.stroke();

        // 计算曲线末端坐标（箭头尖的位置）
        const tEnd = 1; // 参数化曲线末端
        const endX =
          (1 - tEnd) * (1 - tEnd) * link.source.x +
          2 * (1 - tEnd) * tEnd * controlX +
          tEnd * tEnd * link.target.x; // 曲线末端X坐标
        const endY =
          (1 - tEnd) * (1 - tEnd) * link.source.y +
          2 * (1 - tEnd) * tEnd * controlY +
          tEnd * tEnd * link.target.y; // 曲线末端Y坐标

        // 计算曲线末端的切线方向
        const tangentEndX = 2 * (1 - tEnd) * (controlX - link.source.x) + 2 * tEnd * (link.target.x - controlX);
        const tangentEndY = 2 * (1 - tEnd) * (controlY - link.source.y) + 2 * tEnd * (link.target.y - controlY);
        const lineLength = Math.sqrt(tangentEndX * tangentEndX + tangentEndY * tangentEndY);
        const endAngle = Math.atan2(tangentEndY, tangentEndX); // 曲线末端的切线方向角度

        // 计算箭头尖的实际位置（考虑节点半径和线条宽度）
        const arrowTipX = endX - (nodeRadius + lineWidth / 2) * (tangentEndX / lineLength);
        const arrowTipY = endY - (nodeRadius + lineWidth / 2) * (tangentEndY / lineLength);

        // 计算箭头中心位置（从箭头尖往后退箭头长度的一半）
        const arrowLength = 8 / globalScale; // 动态调整箭头长度
        const arrowCenterX = arrowTipX - (arrowLength / 2) * (tangentEndX / lineLength);
        const arrowCenterY = arrowTipY - (arrowLength / 2) * (tangentEndY / lineLength);

        // 绘制箭头
        const arrowWidth = 5 / globalScale; // 动态调整箭头宽度
        ctx.save();
        ctx.translate(arrowCenterX, arrowCenterY); // 将画布的坐标系移动到箭头中心
        ctx.rotate(endAngle); // 旋转画布到切线方向
        ctx.beginPath();
        ctx.moveTo(arrowLength / 2, 0); // 箭头尖
        ctx.lineTo(-arrowLength / 2, arrowWidth / 2); // 箭头右侧
        ctx.lineTo(-arrowLength / 2, -arrowWidth / 2); // 箭头左侧
        ctx.closePath();
        ctx.fillStyle = '#444444'; // 设置箭头颜色
        ctx.fill();
        ctx.restore();

        // 计算曲线中点
        const t = 0.5; // 参数化曲线的中点
        const midX =
          (1 - t) * (1 - t) * link.source.x +
          2 * (1 - t) * t * controlX +
          t * t * link.target.x; // 二次贝塞尔曲线公式
        const midY =
          (1 - t) * (1 - t) * link.source.y +
          2 * (1 - t) * t * controlY +
          t * t * link.target.y;

        // 计算曲线中点的切线方向（角度）
        const tangentX = 2 * (1 - t) * (controlX - link.source.x) + 2 * t * (link.target.x - controlX);
        const tangentY = 2 * (1 - t) * (controlY - link.source.y) + 2 * t * (link.target.y - controlY);
        const angle = Math.atan2(tangentY, tangentX); // 切线的方向角度

        // 绘制关系类型文本
        const text = link.type; // 获取关系类型文本
        ctx.save();
        ctx.translate(midX, midY); // 将画布的坐标系移动到曲线中点
        ctx.rotate(angle); // 旋转画布坐标系到切线方向
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center'; // 文本水平居中
        ctx.textBaseline = 'middle'; // 文本垂直居中
        ctx.fillStyle = 'black'; // 文本颜色
        ctx.fillText(text, 0, -5); // 在中点绘制文本，稍微偏移
        ctx.restore();

        link.__labelX = midX; // 将 Type 的位置保存到 link 上
        link.__labelY = midY; // 将 Type 的位置保存到 link 上
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
      enableZoomInteraction={enableZoom} // 根据传入参数控制是否允许滚轮缩放
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
          if (chargeForce) chargeForce.strength(-1500); // 增强节点间的排斥力
          if (linkForce) linkForce.distance(200); // 设置节点之间的距离
        }
      }}
      onNodeClick={(node, event) => {
        // 仅阻止默认交互，不移动整个图形
        event.stopPropagation();
        alert(`Node clicked: ${node.displayLabel}\nProperties:\n${JSON.stringify(node.properties, null, 2)}`);
      }}
      onLinkClick={(link, event) => {
        // 仅阻止默认交互，不移动整个图形
        event.stopPropagation();
        alert(`Link clicked: ${link.type}\nProperties:\n${JSON.stringify(link.properties, null, 2)}`);
      }}
    />
  );
};

export default DrawGraph;
