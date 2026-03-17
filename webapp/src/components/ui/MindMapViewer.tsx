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
  onClose: () => void;
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

// Custom Node to make them look "glassmorphic" and premium
const CustomNode = ({ data }: { data: Record<string, unknown> | any }) => {
  const bgColor = 
    data.type === 'law' ? 'from-blue-500/10 to-blue-600/5 border-blue-200' :
    data.type === 'fact' ? 'from-emerald-500/10 to-emerald-600/5 border-emerald-200' :
    data.type === 'conclusion' ? 'from-purple-500/10 to-purple-600/5 border-purple-200' :
    data.type === 'exception' ? 'from-amber-500/10 to-amber-600/5 border-amber-200' :
    'from-slate-500/10 to-slate-600/5 border-slate-200';

  const icon = 
    data.type === 'law' ? '⚖️' :
    data.type === 'fact' ? '👤' :
    data.type === 'conclusion' ? '🎯' :
    data.type === 'exception' ? '⚠️' : '💡';

  return (
    <div className={`px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-md border shadow-lg bg-gradient-to-br ${bgColor} min-w-[200px] max-w-[280px]`}>
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

export default function MindMapViewer({ initialNodes, initialEdges, onClose }: MindMapProps) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Map initial nodes to the React Flow format injecting our 'custom' type
  const formattedNodes = initialNodes.map((n: any) => ({
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in-up">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center p-6 border-b border-black/5 bg-white/50 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Mappa Mentale (End-of-Session)</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Atena Cognitive Synthesis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-grow w-full h-full relative bg-[#f8f9fc]/50 backdrop-blur-3xl">
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
            <Controls className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl overflow-hidden fill-slate-700" />
            <MiniMap 
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl"
              maskColor="rgba(248, 250, 252, 0.7)"
              nodeColor={(n: any) => {
                const type = n.data?.type;
                if(type === 'law') return '#3b82f6';
                if(type === 'fact') return '#10b981';
                if(type === 'conclusion') return '#a855f7';
                if(type === 'exception') return '#f59e0b';
                return '#94a3b8';
              }} 
            />
          </ReactFlow>
        </div>

      </div>
    </div>
  );
}
