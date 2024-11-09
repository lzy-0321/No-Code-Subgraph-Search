import React, { useRef } from 'react';
import { ForceGraph2D } from 'react-force-graph';

const GraphComponent = ({ nodes, relationships, enableZoom = true }) => {
  const graphRef = useRef();

  // 定义颜色映射函数
  const getNodeColor = (properties) => {
    if (!properties) return 'gray';

    // 根据类型或其他属性返回颜色
    const type = properties.type || 'default';
    const colorMap = {
      default: '#cccccc',
      Tutorial: '#f39c12',
      Person: '#3498db',
      Company: '#e74c3c',
    };

    // 返回对应颜色或一个随机生成的颜色
    return colorMap[type] || `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  };

  const priorityProperties = ["name", "title", "id"];

  // 获取节点的优先属性
  const getPriorityProperty = (properties) => {
    if (!properties) return '';
    const selectedProperty = priorityProperties.find((prop) => properties[prop]);
    return selectedProperty ? properties[selectedProperty] : Object.values(properties)[0];
  };

  // 转换数据为 Force-Graph 格式
  const data = {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: getPriorityProperty(node.properties),
      properties: node.properties,
    })),
    links: relationships.map((rel) => ({
      source: rel.startNode,
      target: rel.endNode,
      type: rel.type,
      properties: rel.properties,
    })),
  };

  return (
    <ForceGraph2D
      ref={graphRef}
      enablePanInteraction={false} // 禁用全局拖动
      graphData={data}
      nodeLabel={(node) => {
        const props = Object.entries(node.properties)
          .map(([key, value]) => `<strong>${key}</strong>: ${value}`)
          .join('<br />');
        return `<div style="text-align: left;">${props}</div>`;
      }}
      linkLabel={(link) => {
        const props = Object.entries(link.properties)
          .map(([key, value]) => `<strong>${key}</strong>: ${value}`)
          .join('<br />');
        return `<div style="text-align: left;">Type: <strong>${link.type}</strong><br />${props}</div>`;
      }}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const label = node.label;
        const fontSize = 14 / globalScale;
        const nodeRadius = 15;
        const fillColor = getNodeColor(node.properties);

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
        ctx.fillStyle = fillColor;
        ctx.fill();

        const lines = label.split(' ');
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        lines.forEach((line, index) => {
          ctx.fillText(line, node.x, node.y + index * (fontSize + 2) - (lines.length - 1) * fontSize / 2);
        });
      }}
      linkDirectionalArrowLength={8}
      linkDirectionalArrowRelPos={0.5}
      linkCurvature={0.2}
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
        graphRef.current.d3Force('charge').strength(-200); // 增强节点间的排斥力
        graphRef.current.d3Force('link').distance(100); // 设置节点之间的距离
      }}
      onNodeClick={(node, event) => {
        // 仅阻止默认交互，不移动整个图形
        event.stopPropagation();
        alert(`Node clicked: ${node.label}\nProperties:\n${JSON.stringify(node.properties, null, 2)}`);
      }}
      onLinkClick={(link, event) => {
        // 仅阻止默认交互，不移动整个图形
        event.stopPropagation();
        alert(`Link clicked: ${link.type}\nProperties:\n${JSON.stringify(link.properties, null, 2)}`);
      }}
    />
  );
};

export default GraphComponent;
