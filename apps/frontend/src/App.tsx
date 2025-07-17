import React, { useCallback } from 'react';
import '@xyflow/react/dist/style.css';
import Sidebar from './sideBar.tsx';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';

function Canvas() {
  // starter graph: two nodes with one edge
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    { id: '1', position: { x: 100, y: 100 }, data: { label: 'Start' }, type: 'input' },
    { id: '2', position: { x: 400, y: 200 }, data: { label: 'End' }, type: 'output' },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([
    { id: 'e12', source: '1', target: '2' },
  ]);

  const { screenToFlowPosition } = useReactFlow();

  // allow drag-connect to create new edges
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type') || 'default';

    if (type) {
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position,
        data: { label: `${type} ${nodes.length + 1}` }
      };

      setNodes((nds) => [...nds, newNode]);
    }
  }, [screenToFlowPosition, nodes.length, setNodes]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        flex: 1,
        position: 'relative',
        backgroundColor: '#f0f0f0'
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }}
      >
        <Background gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

/* wrap Canvas with provider and sidebar */
export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </div>
  );
}
