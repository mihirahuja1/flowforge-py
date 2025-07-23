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
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';

// Type definitions
interface ExecutionStep {
  node_id: string;
  status: string;
  input_data?: any;
  output_data?: any;
  error?: string;
  start_time?: string;
  end_time?: string;
}

// Add CSS for spinning animation
const spinAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinAnimation;
  document.head.appendChild(style);
}

// Generate unique IDs using timestamp and random number
const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function Canvas() {
  // starter graph: empty canvas
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Undo functionality
  const [history, setHistory] = useState<Array<{ nodes: Node[], edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string>('idle'); // 'idle', 'running', 'completed', 'error'
  const [executionSteps, setExecutionSteps] = useState<Array<ExecutionStep>>([]);

  // Save state to history
  const saveToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Reset graph
  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will completely clear the entire graph and all your work.\n\n' +
      'This action cannot be undone. Are you sure you want to reset everything?'
    );

    if (confirmed) {
      // Clear everything - no initial nodes or edges
      setNodes([]);
      setEdges([]);
      setHistory([]);
      setHistoryIndex(-1);
      setSelectedEdge(null);
    }
  }, [setNodes, setEdges]);

  // Delete selected edge
  const handleDeleteEdge = useCallback(() => {
    if (selectedEdge) {
      setEdges(edges => edges.filter(edge => edge.id !== selectedEdge));
      setSelectedEdge(null);
    }
  }, [selectedEdge, setEdges]);

  // Handle edge selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.id);
  }, []);

  // Handle pane click to deselect edge
  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  const { screenToFlowPosition } = useReactFlow();
  const [showDagJson, setShowDagJson] = useState(false);
  const [showPythonCode, setShowPythonCode] = useState(false);

  // Generate Python code from the workflow
  const generatePythonCode = useCallback(() => {
    if (nodes.length === 0) {
      return "No nodes in the workflow to generate code from.";
    }

    let code = `# Generated Python Workflow Code
# This code represents your visual AI workflow

import requests
import json
from typing import Any, Dict, List

# Node Functions
`;

    // Generate function for each node
    nodes.forEach((node, index) => {
      const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');

      switch (node.type) {
        case 'input':
          code += `
def ${nodeId}_input() -> str:
    """Input node: ${node.data.label || 'Input'}"""
    return "${node.data.label || 'input_data'}"
`;
          break;

        case 'output':
          code += `
def ${nodeId}_output(data: Any) -> None:
    """Output node: ${node.data.label || 'Output'}"""
    print(f"Output: {data}")
    return data
`;
          break;

        case 'textEditor':
          code += `
def ${nodeId}_text_editor(data: Any) -> str:
    """Text Editor node: ${node.data.label || 'Text Editor'}"""
    # Process the input data
    return str(data)
`;
          break;

        case 'pythonFunction':
          const pythonCode = String(node.data.code || 'def process_data(input_data):\n    return input_data');
          code += `
def ${nodeId}_python_function(data: Any) -> Any:
    """Python Function node: ${node.data.label || 'Python Function'}"""
    ${pythonCode.replace(/^def\s+\w+/, 'def process_data').replace(/^/, '    ')}
    return process_data(data)
`;
          break;

        case 'llmCall':
          const model = node.data.model || 'gpt-3.5-turbo';
          const prompt = node.data.prompt || 'Process the following data:';
          code += `
def ${nodeId}_llm_call(data: Any) -> str:
    """LLM Call node: ${node.data.label || 'LLM Call'}"""
    # This is a placeholder for actual LLM API call
    # You would need to implement the actual API call here
    prompt = f"${prompt}\\n\\nData: {{data}}"
    print(f"Calling ${model} with prompt: {{prompt}}")
    # Placeholder response
    return f"LLM response for: {{data}}"
`;
          break;

        case 'curl':
          const method = node.data.method || 'GET';
          const url = node.data.url || 'https://api.example.com/endpoint';
          const headers = node.data.headers || '{}';
          const body = node.data.body || '';
          code += `
def ${nodeId}_curl_request(data: Any) -> Dict[str, Any]:
    """Curl Request node: ${node.data.label || 'Curl Request'}"""
    url = "${url}"
    method = "${method}"
    headers = ${headers}
    ${body ? `body = ${JSON.stringify(body)}` : 'body = None'}
    
    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=body if method in ['POST', 'PUT', 'PATCH'] else None,
            params=body if method == 'GET' else None
        )
        return {{
            "status_code": response.status_code,
            "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "headers": dict(response.headers)
        }}
    except Exception as e:
        return {{"error": str(e)}}
`;
          break;

        default:
          code += `
def ${nodeId}_unknown(data: Any) -> Any:
    """Unknown node type: ${node.type}"""
    return data
`;
      }
    });

    // Generate the main workflow function
    code += `

# Main Workflow Function
def execute_workflow() -> Any:
    """Execute the complete workflow"""
`;

    // Find nodes without incoming edges (start nodes)
    const startNodes = nodes.filter(node =>
      !edges.some(edge => edge.target === node.id)
    );

    if (startNodes.length === 0) {
      code += `    # No start nodes found
    return None
`;
    } else {
      // Build execution order based on edges
      const executionOrder = buildExecutionOrder(nodes, edges);

      code += `    # Execution order: ${executionOrder.map(n => n.data.label || n.id).join(' → ')}
    
    # Initialize results storage
    results = {}
    
`;

      executionOrder.forEach((node, index) => {
        const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
        const incomingEdges = edges.filter(edge => edge.target === node.id);

        if (incomingEdges.length === 0) {
          // Start node
          code += `    # Execute ${node.data.label || node.id}
    results['${node.id}'] = ${nodeId}_${node.type === 'input' ? 'input' :
              node.type === 'output' ? 'output' :
                node.type === 'textEditor' ? 'text_editor' :
                  node.type === 'pythonFunction' ? 'python_function' :
                    node.type === 'llmCall' ? 'llm_call' :
                      node.type === 'curl' ? 'curl_request' : 'unknown'}()
`;
        } else {
          // Node with inputs
          const inputNode = incomingEdges[0];
          code += `    # Execute ${node.data.label || node.id}
    results['${node.id}'] = ${nodeId}_${node.type === 'input' ? 'input' :
              node.type === 'output' ? 'output' :
                node.type === 'textEditor' ? 'text_editor' :
                  node.type === 'pythonFunction' ? 'python_function' :
                    node.type === 'llmCall' ? 'llm_call' :
                      node.type === 'curl' ? 'curl_request' : 'unknown'}(results['${inputNode.source}'])
`;
        }
      });

      code += `
    return results

# Run the workflow
if __name__ == "__main__":
    result = execute_workflow()
    print("Workflow completed!")
    print("Final result:", result)
`;
    }

    return code;
  }, [nodes, edges]);

  // Helper function to build execution order
  const buildExecutionOrder = (nodes: Node[], edges: Edge[]): Node[] => {
    const order: Node[] = [];
    const visited = new Set<string>();

    // Find nodes without incoming edges (start nodes)
    const startNodes = nodes.filter(node =>
      !edges.some(edge => edge.target === node.id)
    );

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        order.push(node);

        // Visit all nodes that this node connects to
        edges.filter(edge => edge.source === nodeId)
          .forEach(edge => visit(edge.target));
      }
    };

    startNodes.forEach(node => visit(node.id));

    // Add any remaining nodes
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        order.push(node);
      }
    });

    return order;
  };

  // allow drag-connect to create new edges
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge_${Date.now()}`,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#333',
        },
        style: { stroke: '#333', strokeWidth: 2 }
      };
      const newEdges = addEdge(newEdge, edges);
      setEdges(newEdges);
      saveToHistory(nodes, newEdges);
    },
    [setEdges, edges, nodes, saveToHistory]
  );

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type') || 'textEditor';

    console.log('Drop event triggered:', { type, clientX: e.clientX, clientY: e.clientY });

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

      console.log('Creating new node:', newNode);
      console.log('Current nodes before adding:', nodes);

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      saveToHistory(newNodes, edges);

      console.log('Nodes after adding:', newNodes);
    }
  }, [screenToFlowPosition, setNodes, nodes, edges, saveToHistory]);

  const handlePlay = async () => {
    if (nodes.length === 0) {
      alert('No nodes to execute!');
      return;
    }

    console.log('Executing DAG...');
    console.log('Nodes:', nodes);
    console.log('Edges:', edges);

    // Reset execution state
    setExecutionStatus('running');
    setExecutionSteps([]);
    setExecutionId(null);

    try {
      // Call backend API
      const response = await fetch('http://localhost:8000/api/execute-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodes,
          edges: edges
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Execution result:', result);

      setExecutionId(result.execution_id);
      setExecutionSteps(result.steps);
      setExecutionStatus(result.status);

      // Show final result
      if (result.status === 'completed') {
        alert(`Workflow completed successfully!\nFinal result: ${JSON.stringify(result.final_result, null, 2)}`);
      } else if (result.status === 'error') {
        alert(`Workflow failed!\nError: ${JSON.stringify(result.final_result, null, 2)}`);
      }

    } catch (error) {
      console.error('Execution error:', error);
      setExecutionStatus('error');
      alert(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  // Custom node component with text editor
  function TextEditorNode({ data, id }: NodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(String(data.label || ''));
    const [showEditIcon, setShowEditIcon] = useState(false);

    // Get execution status for this node
    const executionStep = executionSteps?.find((step: ExecutionStep) => step.node_id === id);
    const nodeStatus = executionStep?.status || 'idle';

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleEditClick = () => {
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

    // Get status color and icon
    const getStatusStyle = () => {
      switch (nodeStatus) {
        case 'waiting':
          return { color: '#ff9800', icon: '⏳' };
        case 'running':
          return { color: '#2196f3', icon: '🔄' };
        case 'completed':
          return { color: '#4caf50', icon: '✅' };
        case 'error':
          return { color: '#f44336', icon: '❌' };
        default:
          return { color: '#666', icon: '' };
      }
    };

    const statusStyle = getStatusStyle();

    return (
      <div
        style={{
          background: '#fff',
          border: `2px solid ${statusStyle.color}`,
          borderRadius: 8,
          padding: 10,
          minWidth: 150,
          minHeight: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isEditing ? 'text' : 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setShowEditIcon(true)}
        onMouseLeave={() => setShowEditIcon(false)}
      >
        {/* Status indicator */}
        {nodeStatus !== 'idle' && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: statusStyle.color,
            color: 'white',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {statusStyle.icon}
          </div>
        )}

        {/* Edit icon */}
        {showEditIcon && !isEditing && (
          <button
            onClick={handleEditClick}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            ✏️
          </button>
        )}

        {/* Single input and output handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: 4,
                outline: 'none',
                textAlign: 'center',
                fontSize: 14,
                width: '100%',
                color: '#000',
                backgroundColor: '#fff'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>{text}</span>

            {/* Show input/output data if available */}
            {executionStep && (
              <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
                {executionStep.input_data !== undefined && (
                  <div>In: {String(executionStep.input_data).substring(0, 20)}...</div>
                )}
                {executionStep.output_data !== undefined && (
                  <div>Out: {String(executionStep.output_data).substring(0, 20)}...</div>
                )}
                {executionStep.error && (
                  <div style={{ color: '#f44336' }}>Error: {executionStep.error}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Custom input node
  function InputNode({ data, id }: NodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(String(data.label || ''));
    const [showEditIcon, setShowEditIcon] = useState(false);

    // Get execution status for this node
    const executionStep = executionSteps?.find((step: ExecutionStep) => step.node_id === id);
    const nodeStatus = executionStep?.status || 'idle';

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleEditClick = () => {
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

    // Get status color and icon
    const getStatusStyle = () => {
      switch (nodeStatus) {
        case 'waiting':
          return { color: '#ff9800', icon: '⏳' };
        case 'running':
          return { color: '#2196f3', icon: '🔄' };
        case 'completed':
          return { color: '#4caf50', icon: '✅' };
        case 'error':
          return { color: '#f44336', icon: '❌' };
        default:
          return { color: '#666', icon: '' };
      }
    };

    const statusStyle = getStatusStyle();

    return (
      <div
        style={{
          background: '#e8f5e8',
          border: `2px solid ${statusStyle.color}`,
          borderRadius: 8,
          padding: 10,
          minWidth: 150,
          minHeight: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isEditing ? 'text' : 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setShowEditIcon(true)}
        onMouseLeave={() => setShowEditIcon(false)}
      >
        {/* Status indicator */}
        {nodeStatus !== 'idle' && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: statusStyle.color,
            color: 'white',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {statusStyle.icon}
          </div>
        )}

        {/* Edit icon */}
        {showEditIcon && !isEditing && (
          <button
            onClick={handleEditClick}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            ✏️
          </button>
        )}

        {/* Single output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: 4,
                outline: 'none',
                textAlign: 'center',
                fontSize: 14,
                width: '100%',
                color: '#000',
                backgroundColor: '#fff'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>{text}</span>

            {/* Show output data if available */}
            {executionStep && (
              <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
                {executionStep.output_data !== undefined && (
                  <div>Out: {String(executionStep.output_data).substring(0, 20)}...</div>
                )}
                {executionStep.error && (
                  <div style={{ color: '#f44336' }}>Error: {executionStep.error}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Custom output node
  function OutputNode({ data, id }: NodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(String(data.label || ''));
    const [showEditIcon, setShowEditIcon] = useState(false);

    // Get execution status for this node
    const executionStep = executionSteps?.find((step: ExecutionStep) => step.node_id === id);
    const nodeStatus = executionStep?.status || 'idle';

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleEditClick = () => {
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

    // Get status color and icon
    const getStatusStyle = () => {
      switch (nodeStatus) {
        case 'waiting':
          return { color: '#ff9800', icon: '⏳' };
        case 'running':
          return { color: '#2196f3', icon: '🔄' };
        case 'completed':
          return { color: '#4caf50', icon: '✅' };
        case 'error':
          return { color: '#f44336', icon: '❌' };
        default:
          return { color: '#666', icon: '' };
      }
    };

    const statusStyle = getStatusStyle();

    return (
      <div
        style={{
          background: '#ffe8e8',
          border: `2px solid ${statusStyle.color}`,
          borderRadius: 8,
          padding: 10,
          minWidth: 150,
          minHeight: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isEditing ? 'text' : 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setShowEditIcon(true)}
        onMouseLeave={() => setShowEditIcon(false)}
      >
        {/* Status indicator */}
        {nodeStatus !== 'idle' && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: statusStyle.color,
            color: 'white',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {statusStyle.icon}
          </div>
        )}

        {/* Edit icon */}
        {showEditIcon && !isEditing && (
          <button
            onClick={handleEditClick}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            ✏️
          </button>
        )}

        {/* Single input handle */}
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: 4,
                outline: 'none',
                textAlign: 'center',
                fontSize: 14,
                width: '100%',
                color: '#000',
                backgroundColor: '#fff'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>{text}</span>

            {/* Show input/output data if available */}
            {executionStep && (
              <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
                {executionStep.input_data !== undefined && (
                  <div>In: {String(executionStep.input_data).substring(0, 20)}...</div>
                )}
                {executionStep.output_data !== undefined && (
                  <div>Out: {String(executionStep.output_data).substring(0, 20)}...</div>
                )}
                {executionStep.error && (
                  <div style={{ color: '#f44336' }}>Error: {executionStep.error}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Python Function Node
  function PythonFunctionNode({ data, id }: NodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [code, setCode] = useState(String(data.code || 'def function_name():\n    # Your Python code here\n    pass'));
    const [functionName, setFunctionName] = useState(String(data.label || 'Python Function'));
    const [showEditIcon, setShowEditIcon] = useState(false);

    // Get execution status for this node
    const executionStep = executionSteps?.find((step: ExecutionStep) => step.node_id === id);
    const nodeStatus = executionStep?.status || 'idle';

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleEditClick = () => {
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

    // Get status color and icon
    const getStatusStyle = () => {
      switch (nodeStatus) {
        case 'waiting':
          return { color: '#ff9800', icon: '⏳' };
        case 'running':
          return { color: '#2196f3', icon: '🔄' };
        case 'completed':
          return { color: '#4caf50', icon: '✅' };
        case 'error':
          return { color: '#f44336', icon: '❌' };
        default:
          return { color: '#666', icon: '' };
      }
    };

    const statusStyle = getStatusStyle();

    return (
      <div
        style={{
          background: '#e8f4fd',
          border: `2px solid ${statusStyle.color}`,
          borderRadius: 8,
          padding: 12,
          minWidth: 200,
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          cursor: isEditing ? 'text' : 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setShowEditIcon(true)}
        onMouseLeave={() => setShowEditIcon(false)}
      >
        {/* Status indicator */}
        {nodeStatus !== 'idle' && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: statusStyle.color,
            color: 'white',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {statusStyle.icon}
          </div>
        )}

        {/* Edit icon */}
        {showEditIcon && !isEditing && (
          <button
            onClick={handleEditClick}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            ✏️
          </button>
        )}

        {/* Single input and output handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                color: '#000',
                backgroundColor: '#fff'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

            {/* Show input/output data if available */}
            {executionStep && (
              <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
                {executionStep.input_data !== undefined && (
                  <div>In: {String(executionStep.input_data).substring(0, 20)}...</div>
                )}
                {executionStep.output_data !== undefined && (
                  <div>Out: {String(executionStep.output_data).substring(0, 20)}...</div>
                )}
                {executionStep.error && (
                  <div style={{ color: '#f44336' }}>Error: {executionStep.error}</div>
                )}
              </div>
            )}
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    );
  }

  // LLM Call Node
  function LLMCallNode({ data, id }: NodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [prompt, setPrompt] = useState(String(data.prompt || 'Enter your prompt here...'));
    const [model, setModel] = useState(String(data.model || 'gpt-3.5-turbo'));
    const [nodeName, setNodeName] = useState(String(data.label || 'LLM Call'));
    const [showEditIcon, setShowEditIcon] = useState(false);

    // Get execution status for this node
    const executionStep = executionSteps?.find((step: ExecutionStep) => step.node_id === id);
    const nodeStatus = executionStep?.status || 'idle';

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleEditClick = () => {
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

    // Get status color and icon
    const getStatusStyle = () => {
      switch (nodeStatus) {
        case 'waiting':
          return { color: '#ff9800', icon: '⏳' };
        case 'running':
          return { color: '#2196f3', icon: '🔄' };
        case 'completed':
          return { color: '#4caf50', icon: '✅' };
        case 'error':
          return { color: '#f44336', icon: '❌' };
        default:
          return { color: '#666', icon: '' };
      }
    };

    const statusStyle = getStatusStyle();

    return (
      <div
        style={{
          background: '#f3e5f5',
          border: `2px solid ${statusStyle.color}`,
          borderRadius: 8,
          padding: 12,
          minWidth: 200,
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          cursor: isEditing ? 'text' : 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setShowEditIcon(true)}
        onMouseLeave={() => setShowEditIcon(false)}
      >
        {/* Status indicator */}
        {nodeStatus !== 'idle' && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: statusStyle.color,
            color: 'white',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {statusStyle.icon}
          </div>
        )}

        {/* Edit icon */}
        {showEditIcon && !isEditing && (
          <button
            onClick={handleEditClick}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            ✏️
          </button>
        )}

        {/* Single input and output handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

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
                color: '#000',
                backgroundColor: '#fff'
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
                color: '#000',
                backgroundColor: '#fff'
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

            {/* Show input/output data if available */}
            {executionStep && (
              <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
                {executionStep.input_data !== undefined && (
                  <div>In: {String(executionStep.input_data).substring(0, 20)}...</div>
                )}
                {executionStep.output_data !== undefined && (
                  <div>Out: {String(executionStep.output_data).substring(0, 20)}...</div>
                )}
                {executionStep.error && (
                  <div style={{ color: '#f44336' }}>Error: {executionStep.error}</div>
                )}
              </div>
            )}
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    );
  }

  // Curl Node
  function CurlNode({ data, id }: NodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [url, setUrl] = useState(String(data.url || 'https://api.example.com/endpoint'));
    const [method, setMethod] = useState(String(data.method || 'GET'));
    const [headers, setHeaders] = useState(String(data.headers || '{}'));
    const [body, setBody] = useState(String(data.body || ''));
    const [nodeName, setNodeName] = useState(String(data.label || 'Curl Request'));
    const [showEditIcon, setShowEditIcon] = useState(false);

    // Get execution status for this node
    const executionStep = executionSteps?.find((step: ExecutionStep) => step.node_id === id);
    const nodeStatus = executionStep?.status || 'idle';

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleEditClick = () => {
      setIsEditing(true);
    };

    const handleBlur = () => {
      setIsEditing(false);
      data.url = url;
      data.method = method;
      data.headers = headers;
      data.body = body;
      data.label = nodeName;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBlur();
      }
    };

    // Get status color and icon
    const getStatusStyle = () => {
      switch (nodeStatus) {
        case 'waiting':
          return { color: '#ff9800', icon: '⏳' };
        case 'running':
          return { color: '#2196f3', icon: '🔄' };
        case 'completed':
          return { color: '#4caf50', icon: '✅' };
        case 'error':
          return { color: '#f44336', icon: '❌' };
        default:
          return { color: '#666', icon: '' };
      }
    };

    const statusStyle = getStatusStyle();

    return (
      <div
        style={{
          background: '#fff3e0',
          border: `2px solid ${statusStyle.color}`,
          borderRadius: 8,
          padding: 12,
          minWidth: 200,
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          cursor: isEditing ? 'text' : 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setShowEditIcon(true)}
        onMouseLeave={() => setShowEditIcon(false)}
      >
        {/* Status indicator */}
        {nodeStatus !== 'idle' && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: statusStyle.color,
            color: 'white',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {statusStyle.icon}
          </div>
        )}

        {/* Edit icon */}
        {showEditIcon && !isEditing && (
          <button
            onClick={handleEditClick}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            ✏️
          </button>
        )}

        {/* Single input and output handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>🌐</span>
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
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  padding: 4,
                  fontSize: 12,
                  outline: 'none',
                  color: '#000',
                  width: '80px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URL"
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  padding: 4,
                  fontSize: 12,
                  outline: 'none',
                  color: '#000',
                  flex: 1,
                  backgroundColor: '#fff'
                }}
              />
            </div>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder="Headers (JSON format)"
              style={{
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: 8,
                fontSize: 12,
                resize: 'vertical',
                minHeight: 40,
                outline: 'none',
                color: '#000',
                fontFamily: 'monospace',
                backgroundColor: '#fff'
              }}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Request body (for POST/PUT/PATCH)"
              style={{
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: 8,
                fontSize: 12,
                resize: 'vertical',
                minHeight: 40,
                outline: 'none',
                color: '#000',
                fontFamily: 'monospace',
                backgroundColor: '#fff'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 'bold',
                padding: '2px 6px',
                background: '#ff9800',
                color: 'white',
                borderRadius: '4px'
              }}>
                {method}
              </span>
              <span style={{ fontSize: 10, color: '#666' }}>
                {url.substring(0, 30)}{url.length > 30 ? '...' : ''}
              </span>
            </div>
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
              {headers !== '{}' ? `Headers: ${headers.substring(0, 40)}${headers.length > 40 ? '...' : ''}` : 'No headers'}
              {body && (
                <div style={{ marginTop: 4 }}>
                  Body: {body.substring(0, 30)}{body.length > 30 ? '...' : ''}
                </div>
              )}
            </div>

            {/* Show input/output data if available */}
            {executionStep && (
              <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
                {executionStep.input_data !== undefined && (
                  <div>In: {String(executionStep.input_data).substring(0, 20)}...</div>
                )}
                {executionStep.output_data !== undefined && (
                  <div>Out: {String(executionStep.output_data).substring(0, 20)}...</div>
                )}
                {executionStep.error && (
                  <div style={{ color: '#f44336' }}>Error: {executionStep.error}</div>
                )}
              </div>
            )}
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    );
  }

  // Define custom node types with execution data
  const nodeTypes = {
    textEditor: (props: NodeProps) => <TextEditorNode {...props} />,
    input: (props: NodeProps) => <InputNode {...props} />,
    output: (props: NodeProps) => <OutputNode {...props} />,
    pythonFunction: (props: NodeProps) => <PythonFunctionNode {...props} />,
    llmCall: (props: NodeProps) => <LLMCallNode {...props} />,
    curl: (props: NodeProps) => <CurlNode {...props} />,
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
    >
      {/* Top right buttons */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff5722',
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
          🔄 Reset
        </button>
        <button
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          style={{
            padding: '10px 20px',
            backgroundColor: historyIndex <= 0 ? '#ccc' : '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ↩️ Undo
        </button>
        <button
          onClick={handleDeleteEdge}
          disabled={!selectedEdge}
          style={{
            padding: '10px 20px',
            backgroundColor: !selectedEdge ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !selectedEdge ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🗑️ Delete Edge
        </button>
        <button
          onClick={handlePlay}
          disabled={executionStatus === 'running'}
          style={{
            padding: '10px 20px',
            backgroundColor: executionStatus === 'running' ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: executionStatus === 'running' ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {executionStatus === 'running' ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Running...
            </>
          ) : (
            <>
              ▶️ Play
            </>
          )}
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
        <button
          onClick={() => setShowPythonCode(!showPythonCode)}
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
          🐍 Python Code
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

      {/* Python Code Modal */}
      {showPythonCode && (
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
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowPythonCode(false)}
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
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Generated Python Code</h3>
            <pre style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#000',
              border: '1px solid #e9ecef',
              maxHeight: '70vh'
            }}>
              {generatePythonCode()}
            </pre>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges.map(edge => ({
          ...edge,
          style: {
            ...edge.style,
            stroke: selectedEdge === edge.id ? '#ff5722' : '#333',
            strokeWidth: selectedEdge === edge.id ? 3 : 2
          }
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        nodeTypes={nodeTypes}
        fitView
        style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }}
      >
        <Background gap={16} />
        <Controls />

        {/* Empty state message */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#666',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎨</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Welcome to Visual AI Programmer!</h3>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
              Start building your AI workflow by dragging nodes from the sidebar.
            </p>
            <div style={{ fontSize: '12px', color: '#888' }}>
              💡 Tip: Drag nodes from the left sidebar onto the canvas to get started
            </div>
          </div>
        )}
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
