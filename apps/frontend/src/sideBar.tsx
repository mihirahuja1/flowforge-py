export default function Sidebar() {
    return (
        <aside style={{
            padding: 20,
            width: 250,
            background: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
        }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Node Palette</h3>

            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'pythonFunction')}
                style={{
                    padding: 12,
                    border: '2px dashed #2196f3',
                    borderRadius: 8,
                    cursor: 'grab',
                    backgroundColor: '#e8f4fd',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#1976d2',
                    transition: 'all 0.2s ease'
                }}
            >
                🐍 Python Function
            </div>

            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'llmCall')}
                style={{
                    padding: 12,
                    border: '2px dashed #9c27b0',
                    borderRadius: 8,
                    cursor: 'grab',
                    backgroundColor: '#f3e5f5',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#7b1fa2',
                    transition: 'all 0.2s ease'
                }}
            >
                🤖 LLM Call
            </div>

            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'curl')}
                style={{
                    padding: 12,
                    border: '2px dashed #ff9800',
                    borderRadius: 8,
                    cursor: 'grab',
                    backgroundColor: '#fff3e0',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#e65100',
                    transition: 'all 0.2s ease'
                }}
            >
                🌐 Curl Request
            </div>

            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'textEditor')}
                style={{
                    padding: 12,
                    border: '2px dashed #ccc',
                    borderRadius: 8,
                    cursor: 'grab',
                    backgroundColor: '#fff',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#666',
                    transition: 'all 0.2s ease'
                }}
            >
                📝 Text Editor
            </div>

            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'input')}
                style={{
                    padding: 12,
                    border: '2px dashed #4caf50',
                    borderRadius: 8,
                    cursor: 'grab',
                    backgroundColor: '#e8f5e8',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#2e7d32',
                    transition: 'all 0.2s ease'
                }}
            >
                🔽 Input Node
            </div>

            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'output')}
                style={{
                    padding: 12,
                    border: '2px dashed #f44336',
                    borderRadius: 8,
                    cursor: 'grab',
                    backgroundColor: '#ffe8e8',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#c62828',
                    transition: 'all 0.2s ease'
                }}
            >
                🔼 Output Node
            </div>

            <div style={{
                marginTop: 20,
                padding: 12,
                backgroundColor: '#e9ecef',
                borderRadius: 6,
                fontSize: '12px',
                color: '#6c757d'
            }}>
                💡 Drag nodes to canvas, double-click to edit
            </div>
        </aside>
    );
}
