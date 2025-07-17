import React, { useCallback, useState } from 'react';
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
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';

// Generate unique IDs
let nodeIdCounter = 1;
const generateNodeId = () => `node_${nodeIdCounter++}`;

// Custom node component with text editor
function TextEditorNode({ data, id }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(String(data.label || ''));

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Update the node data
    data.label = text;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #ddd',
        borderRadius: 8,
        padding: 10,
        minWidth: 150,
        minHeight: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isEditing ? 'text' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} />
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            textAlign: 'center',
            fontSize: 14,
            width: '100%',
            color: '#000'
          }}
        />
      ) : (
        <span style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>{text}</span>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Custom input node
function InputNode({ data, id }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(String(data.label || ''));

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    data.label = text;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div
      style={{
        background: '#e8f5e8',
        border: '2px solid #4caf50',
        borderRadius: 8,
        padding: 10,
        minWidth: 150,
        minHeight: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isEditing ? 'text' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            textAlign: 'center',
            fontSize: 14,
            width: '100%',
            color: '#000'
          }}
        />
      ) : (
        <span style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>{text}</span>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Custom output node
function OutputNode({ data, id }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(String(data.label || ''));

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    data.label = text;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div
      style={{
        background: '#ffe8e8',
        border: '2px solid #f44336',
        borderRadius: 8,
        padding: 10,
        minWidth: 150,
        minHeight: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isEditing ? 'text' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} />
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            textAlign: 'center',
            fontSize: 14,
            width: '100%',
            color: '#000'
          }}
        />
      ) : (
        <span style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>{text}</span>
      )}
    </div>
  );
}

// Python Function Node
function PythonFunctionNode({ data, id }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(String(data.code || 'def function_name():\n    # Your Python code here\n    pass'));
  const [functionName, setFunctionName] = useState(String(data.label || 'Python Function'));

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    data.code = code;
    data.label = functionName;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleBlur();
    }
  };

  return (
    <div
      style={{
        background: '#e8f4fd',
        border: '2px solid #2196f3',
        borderRadius: 8,
        padding: 12,
        minWidth: 200,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        cursor: isEditing ? 'text' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>🐍</span>
        {isEditing ? (
          <input
            type="text"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            onBlur={handleBlur}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 'bold',
              flex: 1,
              color: '#000'
            }}
          />
        ) : (
          <span style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>{functionName}</span>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: 8,
            fontSize: 12,
            fontFamily: 'monospace',
            resize: 'vertical',
            minHeight: 80,
            outline: 'none',
            color: '#000'
          }}
        />
      ) : (
        <pre style={{
          fontSize: 12,
          fontFamily: 'monospace',
          background: '#f5f5f5',
          padding: 8,
          borderRadius: 4,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'pre-wrap',
          maxHeight: 80,
          color: '#000'
        }}>
          {code.substring(0, 100)}{code.length > 100 ? '...' : ''}
        </pre>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// LLM Call Node
function LLMCallNode({ data, id }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState(String(data.prompt || 'Enter your prompt here...'));
  const [model, setModel] = useState(String(data.model || 'gpt-3.5-turbo'));
  const [nodeName, setNodeName] = useState(String(data.label || 'LLM Call'));

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    data.prompt = prompt;
    data.model = model;
    data.label = nodeName;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleBlur();
    }
  };

  return (
    <div
      style={{
        background: '#f3e5f5',
        border: '2px solid #9c27b0',
        borderRadius: 8,
        padding: 12,
        minWidth: 200,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        cursor: isEditing ? 'text' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>🤖</span>
        {isEditing ? (
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            onBlur={handleBlur}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 'bold',
              flex: 1,
              color: '#000'
            }}
          />
        ) : (
          <span style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>{nodeName}</span>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              border: '1px solid #ddd',
              borderRadius: 4,
              padding: 4,
              fontSize: 12,
              outline: 'none',
              color: '#000'
            }}
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="claude-3-haiku">Claude 3 Haiku</option>
          </select>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt here..."
            style={{
              border: '1px solid #ddd',
              borderRadius: 4,
              padding: 8,
              fontSize: 12,
              resize: 'vertical',
              minHeight: 60,
              outline: 'none',
              color: '#000'
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#000', fontWeight: 'bold' }}>{model}</span>
          <div style={{
            fontSize: 12,
            background: '#f5f5f5',
            padding: 8,
            borderRadius: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxHeight: 60,
            color: '#000'
          }}>
            {prompt.substring(0, 80)}{prompt.length > 80 ? '...' : ''}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Define custom node types
const nodeTypes = {
  textEditor: TextEditorNode,
  input: InputNode,
  output: OutputNode,
  pythonFunction: PythonFunctionNode,
  llmCall: LLMCallNode,
};

function Canvas() {
  // starter graph: multiple nodes with connections
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    { id: generateNodeId(), position: { x: 100, y: 100 }, data: { label: 'Start' }, type: 'input' },
    { id: generateNodeId(), position: { x: 300, y: 200 }, data: { label: 'Python Function', code: 'def process_data(input_data):\n    return input_data.upper()' }, type: 'pythonFunction' },
    { id: generateNodeId(), position: { x: 500, y: 100 }, data: { label: 'LLM Call', prompt: 'Analyze the following text and provide insights:', model: 'gpt-3.5-turbo' }, type: 'llmCall' },
    { id: generateNodeId(), position: { x: 700, y: 200 }, data: { label: 'End' }, type: 'output' },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([
    { id: 'e12', source: nodes[0]?.id || 'node_1', target: nodes[1]?.id || 'node_2' },
    { id: 'e23', source: nodes[1]?.id || 'node_2', target: nodes[2]?.id || 'node_3' },
    { id: 'e34', source: nodes[2]?.id || 'node_3', target: nodes[3]?.id || 'node_4' },
  ]);

  const { screenToFlowPosition } = useReactFlow();
  const [showDagJson, setShowDagJson] = useState(false);

  // allow drag-connect to create new edges
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type') || 'textEditor';

    if (type) {
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: Node = {
        id: generateNodeId(),
        type,
        position,
        data: { label: `New ${type}` }
      };

      setNodes((nds) => [...nds, newNode]);
    }
  }, [screenToFlowPosition, setNodes]);

  const handlePlay = () => {
    console.log('Executing DAG...');
    console.log('Nodes:', nodes);
    console.log('Edges:', edges);
    // Here you would implement the actual DAG execution logic
    alert('DAG execution started! Check console for details.');
  };

  const handleShowDagJson = () => {
    setShowDagJson(!showDagJson);
  };

  const dagData = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target
    }))
  };

  console.log('Current nodes:', nodes);
  console.log('Current edges:', edges);

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
      {/* Top right buttons */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        gap: 10
      }}>
        <button
          onClick={handlePlay}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ▶️ Play
        </button>
        <button
          onClick={handleShowDagJson}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📄 DAG JSON
        </button>
      </div>

      {/* DAG JSON Modal */}
      {showDagJson && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '80%',
            maxHeight: '80%',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={handleShowDagJson}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>DAG JSON</h3>
            <pre style={{
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#000'
            }}>
              {JSON.stringify(dagData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
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
