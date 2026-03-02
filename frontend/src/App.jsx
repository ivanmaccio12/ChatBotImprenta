import { useState, useEffect } from 'react';
import './index.css';

const API_URL = `http://${window.location.hostname}:3002`; // Use dynamic IP or domain

const COLUMNS = [
    { id: 'nuevos_pedidos', title: 'Nuevos Pedidos' },
    { id: 'en_proceso', title: 'En Proceso' },
    { id: 'finalizados', title: 'Finalizados' },
    { id: 'entregados', title: 'Entregados' }
];

function App() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/orders`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const moveOrder = async (orderId, currentStatus, direction) => {
        const currentIndex = COLUMNS.findIndex(c => c.id === currentStatus);
        let newIndex = currentIndex;

        if (direction === 'next' && currentIndex < COLUMNS.length - 1) {
            newIndex = currentIndex + 1;
        } else if (direction === 'prev' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        }

        if (newIndex === currentIndex) return;

        const newStatus = COLUMNS[newIndex].id;

        // Optimistic UI update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        try {
            await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            console.error("Failed to update status", err);
            fetchOrders(); // Revert on failure
        }
    };

    if (loading) return <div className="loading">Cargando tablero...</div>;

    return (
        <div className="kanban-container">
            <header className="header">
                <h1>Axis Kanban</h1>
                <p>Gestión de Pedidos de CopyShow</p>
            </header>

            <div className="board">
                {COLUMNS.map(col => {
                    const columnOrders = orders.filter(o => (o.status || 'nuevos_pedidos') === col.id);

                    return (
                        <div key={col.id} className={`column col-${col.id}`}>
                            <div className="column-header">
                                <span className="column-title">{col.title}</span>
                                <span className="column-count">{columnOrders.length}</span>
                            </div>

                            <div className="column-content">
                                {columnOrders.map(order => (
                                    <div key={order.id} className={`card card-${order.status || 'nuevos_pedidos'}`}>
                                        <div className="card-title">Pedido #{order.id}</div>
                                        <div className="card-details">
                                            <div><strong>Ref MP:</strong> {order.mp_reference}</div>
                                            <div><strong>Teléfono:</strong> {order.customer_phone}</div>
                                            {order.details && Array.isArray(order.details) && order.details.map((item, i) => (
                                                <div key={i} style={{ marginTop: '4px' }}>
                                                    • {item.title || item.name} ({item.quantity}x)
                                                </div>
                                            ))}
                                        </div>

                                        <div className="card-footer">
                                            <div className="card-price">
                                                ${Number(order.total_price).toLocaleString('es-AR')}
                                            </div>
                                            <div className="card-actions">
                                                {col.id !== 'nuevos_pedidos' && (
                                                    <button
                                                        className="btn-move"
                                                        onClick={() => moveOrder(order.id, col.id, 'prev')}
                                                        title="Mover atrás"
                                                    >
                                                        ←
                                                    </button>
                                                )}
                                                {col.id !== 'entregados' && (
                                                    <button
                                                        className="btn-move"
                                                        onClick={() => moveOrder(order.id, col.id, 'next')}
                                                        title="Avanzar etapa"
                                                    >
                                                        →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {columnOrders.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Sin pedidos
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default App;
