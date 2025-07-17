export default function Sidebar() {
    return (
        <aside style={{
            padding: 20,
            width: 250,
            background: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
        }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Node Palette</h3>
            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'default')}
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
                📦 Default Node
            </div>
            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'input')}
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
                🔽 Input Node
            </div>
            <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', 'output')}
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
                💡 Drag nodes to the canvas to create new elements
            </div>
        </aside>
    );
}
