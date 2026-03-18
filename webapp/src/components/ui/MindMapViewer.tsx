'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

interface MindMapProps {
  initialNodes: Record<string, unknown>[];
  initialEdges: Record<string, unknown>[];
}

// Dagre configuration for auto-layouting
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

const CustomNode = ({ data }: { data: { type?: string; label?: string; description?: string } }) => {
  const bgColor = 
    data.type === 'law' ? 'from-platinum-500/10 to-platinum-600/5 border-platinum-500/30' :
    data.type === 'fact' ? 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/30' :
    data.type === 'conclusion' ? 'from-purple-500/10 to-purple-600/5 border-purple-500/30' :
    data.type === 'exception' ? 'from-amber-500/10 to-amber-600/5 border-amber-500/30' :
    'from-slate-500/10 to-slate-600/5 border-slate-500/30';

  const icon = 
    data.type === 'law' ? '⚖️' :
    data.type === 'fact' ? '👤' :
    data.type === 'conclusion' ? '🎯' :
    data.type === 'exception' ? '⚠️' : '💡';

  return (
    <div className={`px-4 py-3 rounded-[24px] bg-white/80 backdrop-blur-md border shadow-lg bg-gradient-to-br ${bgColor} min-w-[200px] max-w-[280px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-white bg-slate-400" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
           <span className="text-lg">{icon}</span>
           <h3 className="text-sm font-bold text-slate-800 leading-tight">{data.label}</h3>
        </div>
        {data.description && (
          <p className="text-[10px] text-slate-500 leading-snug font-medium line-clamp-3">
            {data.description}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-white bg-slate-400" />
    </div>
  );
};

export default function MindMapViewer({ initialNodes, initialEdges }: MindMapProps) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Map initial nodes to the React Flow format injecting our 'custom' type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedNodes = initialNodes.map((n: Record<string, any>) => ({
    id: n.id,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label: n.label, type: n.type, description: n.description }
  }));

  const formattedEdges = initialEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    style: { strokeWidth: 2, stroke: '#94a3b8' },
    labelStyle: { fill: '#64748b', fontWeight: 700, fontSize: 10 },
    labelBgStyle: { fill: 'rgba(255, 255, 255, 0.75)' },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
  }));

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    formattedNodes as Node[],
    formattedEdges as unknown as Edge[],
    'TB'
  );

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  return (
    <div className="w-full h-full relative bg-marble-100/50 rounded-[32px] overflow-hidden animate-fade-in-up">
      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
        className="w-full h-full"
        nodesConnectable={false}
        nodesDraggable={true}
        elementsSelectable={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={2} color="#cbd5e1" />
        <Controls className="bg-white/80 backdrop-blur-md border border-marble-200 shadow-xl rounded-[24px] overflow-hidden fill-slate-700 text-slate-700" />
        <MiniMap 
          className="bg-white/80 backdrop-blur-md rounded-[24px] border border-marble-200 shadow-xl"
          maskColor="rgba(255, 255, 255, 0.7)"
          nodeColor={(n: { data?: { type?: string } }) => {
            const type = n.data?.type;
            if(type === 'law') return '#71717a';
            if(type === 'fact') return '#10b981';
            if(type === 'conclusion') return '#a855f7';
            if(type === 'exception') return '#f59e0b';
            return '#94a3b8';
          }} 
        />
      </ReactFlow>
    </div>
  );
}

