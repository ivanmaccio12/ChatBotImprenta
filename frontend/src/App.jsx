import { useState, useEffect, useCallback } from 'react';
import './index.css';
import ChatCRM from './components/ChatCRM.jsx';

const API_URL = `http://${window.location.hostname}:3002`;

const COLUMNS = [
    { id: 'en_revision', title: 'En Revisión' },
    { id: 'nuevos_pedidos', title: 'Nuevos Pedidos' },
    { id: 'en_proceso', title: 'En Proceso' },
    { id: 'para_retirar', title: 'Para Retirar' },
    { id: 'entregados', title: 'Entregados' }
];

// SVG Icons as components (no emojis per UI/UX skill rules)
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
);

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
);

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
);

// Toast notification component
function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div className={`toast ${toast.type}`}>
            {toast.type === 'success' && '✓ '}
            {toast.type === 'error' && '✕ '}
            {toast.type === 'warning' && '⚠ '}
            {toast.message}
        </div>
    );
}

// WhatsApp confirmation modal
function WhatsAppModal({ order, onConfirm, onCancel }) {
    if (!order) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-title">
                    <WhatsAppIcon /> Notificar al cliente
                </div>
                <div className="modal-body">
                    Se enviará un mensaje de WhatsApp a <strong>{order.customer_phone}</strong> informando que el pedido <strong>#{order.order_number || order.id}</strong> está listo para retirar.
                    {order.customer_name && (
                        <><br /><br />Cliente: <strong>{order.customer_name}</strong></>
                    )}
                </div>
                <div className="modal-actions">
                    <button className="btn-modal cancel" onClick={onCancel}>Cancelar</button>
                    <button className="btn-modal confirm" onClick={onConfirm}>Enviar WhatsApp</button>
                </div>
            </div>
        </div>
    );
}

function App() {
    const [view, setView] = useState('kanban');
    const [orders, setOrders] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAllDelivered, setShowAllDelivered] = useState(false);
    const [toast, setToast] = useState(null);
    const [whatsappModal, setWhatsappModal] = useState(null); // order to confirm

    // Filters
    const [searchText, setSearchText] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('todos');
    const [dateFilter, setDateFilter] = useState('todos');
    const [employeeFilter, setEmployeeFilter] = useState('todos');

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const fetchOrders = useCallback(async () => {
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
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/employees`);
            const data = await res.json();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchEmployees();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders, fetchEmployees]);

    // Move order to next/prev column
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
        const order = orders.find(o => o.id === orderId);

        // Block moving to 'entregados' if not paid
        if (newStatus === 'entregados' && order?.payment_status !== 'pagado') {
            showToast('No se puede entregar un pedido sin pagar', 'warning');
            return;
        }

        // Show WhatsApp confirmation when moving to 'para_retirar'
        if (newStatus === 'para_retirar' && order?.customer_phone) {
            setWhatsappModal({ ...order, targetStatus: newStatus });
            return;
        }

        await executeStatusChange(orderId, newStatus);
    };

    const executeStatusChange = async (orderId, newStatus) => {
        // Optimistic UI update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        try {
            const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Error al cambiar estado', 'error');
                fetchOrders();
                return;
            }
            if (newStatus === 'para_retirar') {
                showToast('Pedido listo para retirar. Notificación enviada por WhatsApp', 'success');
            }
            // Update with server response
            setOrders(prev => prev.map(o => o.id === orderId ? data.data : o));
        } catch (err) {
            console.error("Failed to update status", err);
            showToast('Error de conexión', 'error');
            fetchOrders();
        }
    };

    const handleWhatsAppConfirm = () => {
        if (whatsappModal) {
            executeStatusChange(whatsappModal.id, whatsappModal.targetStatus);
        }
        setWhatsappModal(null);
    };

    // Toggle payment status
    const togglePayment = async (orderId, currentPaymentStatus) => {
        const newPaymentStatus = currentPaymentStatus === 'pagado' ? 'pendiente' : 'pagado';

        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, payment_status: newPaymentStatus } : o
        ));

        try {
            await fetch(`${API_URL}/orders/${orderId}/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_status: newPaymentStatus })
            });
            showToast(newPaymentStatus === 'pagado' ? 'Pedido marcado como PAGADO' : 'Pedido marcado como PENDIENTE', 'success');
        } catch (err) {
            console.error("Failed to update payment", err);
            showToast('Error al actualizar pago', 'error');
            fetchOrders();
        }
    };

    // Assign employee
    const assignEmployee = async (orderId, employeeName) => {
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, assigned_employee: employeeName || null } : o
        ));

        try {
            await fetch(`${API_URL}/orders/${orderId}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_employee: employeeName || null })
            });
        } catch (err) {
            console.error("Failed to assign employee", err);
            fetchOrders();
        }
    };

    // Apply filters
    const filterOrders = useCallback((ordersList) => {
        let filtered = [...ordersList];

        // Text search
        if (searchText.trim()) {
            const search = searchText.toLowerCase().trim();
            filtered = filtered.filter(o =>
                (o.customer_name && o.customer_name.toLowerCase().includes(search)) ||
                (o.customer_phone && o.customer_phone.includes(search)) ||
                (o.order_number && String(o.order_number).includes(search)) ||
                (o.id && String(o.id).includes(search)) ||
                (o.mp_reference && o.mp_reference.toLowerCase().includes(search))
            );
        }

        // Payment filter
        if (paymentFilter !== 'todos') {
            filtered = filtered.filter(o => (o.payment_status || 'pendiente') === paymentFilter);
        }

        // Date filter
        if (dateFilter !== 'todos') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);

            filtered = filtered.filter(o => {
                const orderDate = new Date(o.created_at);
                if (dateFilter === 'hoy') return orderDate >= today;
                if (dateFilter === 'semana') return orderDate >= weekAgo;
                if (dateFilter === 'mes') return orderDate >= monthAgo;
                return true;
            });
        }

        // Employee filter
        if (employeeFilter !== 'todos') {
            if (employeeFilter === 'sin_asignar') {
                filtered = filtered.filter(o => !o.assigned_employee);
            } else {
                filtered = filtered.filter(o => o.assigned_employee === employeeFilter);
            }
        }

        // Sort by created_at ASC (oldest first)
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        return filtered;
    }, [searchText, paymentFilter, dateFilter, employeeFilter]);

    if (loading) return <div className="loading">Cargando tablero...</div>;

    const filteredOrders = filterOrders(orders);

    return (
        <div className="app-container">
            <header className="main-header">
                <div className="logo-area">
                    <h1>Axis Workspace</h1>
                    <p>CopyShow Salta</p>
                </div>
                <nav className="main-nav">
                    <button
                        className={`nav-btn ${view === 'kanban' ? 'active' : ''}`}
                        onClick={() => setView('kanban')}
                    >
                        <ClipboardIcon /> Tablero Pedidos
                    </button>
                    <button
                        className={`nav-btn ${view === 'crm' ? 'active' : ''}`}
                        onClick={() => setView('crm')}
                    >
                        <ChatIcon /> CRM WhatsApp
                    </button>
                </nav>
            </header>

            {view === 'kanban' ? (
                <div className="kanban-container">
                    {/* Toolbar with filters */}
                    <div className="kanban-toolbar">
                        <div className="search-box">
                            <SearchIcon />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Buscar por cliente, pedido, teléfono..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <span className="filter-label">Pago:</span>
                            {['todos', 'pagado', 'pendiente'].map(f => (
                                <button
                                    key={f}
                                    className={`filter-btn ${paymentFilter === f ? 'active' : ''}`}
                                    onClick={() => setPaymentFilter(f)}
                                >
                                    {f === 'todos' ? 'Todos' : f === 'pagado' ? 'Pagados' : 'Pendientes'}
                                </button>
                            ))}
                        </div>

                        <div className="filter-group">
                            <span className="filter-label">Fecha:</span>
                            {['todos', 'hoy', 'semana', 'mes'].map(f => (
                                <button
                                    key={f}
                                    className={`filter-btn ${dateFilter === f ? 'active' : ''}`}
                                    onClick={() => setDateFilter(f)}
                                >
                                    {f === 'todos' ? 'Todos' : f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Semana' : 'Mes'}
                                </button>
                            ))}
                        </div>

                        <div className="filter-group">
                            <span className="filter-label">Empleado:</span>
                            <select
                                className="filter-select"
                                value={employeeFilter}
                                onChange={e => setEmployeeFilter(e.target.value)}
                            >
                                <option value="todos">Todos</option>
                                <option value="sin_asignar">Sin asignar</option>
                                {employees.map(emp => (
                                    <option key={emp} value={emp}>{emp}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Board */}
                    <div className="board">
                        {COLUMNS.map(col => {
                            const allColumnOrders = filteredOrders.filter(o => (o.status || 'nuevos_pedidos') === col.id);
                            const isEntregados = col.id === 'entregados';
                            const columnOrders = (isEntregados && !showAllDelivered)
                                ? allColumnOrders.slice(0, 10)
                                : allColumnOrders;

                            return (
                                <div key={col.id} className={`column col-${col.id}`}>
                                    <div className="column-header">
                                        <span className="column-title">{col.title}</span>
                                        <span className="column-count">{allColumnOrders.length}</span>
                                    </div>

                                    <div className="column-content">
                                        {columnOrders.map(order => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                colId={col.id}
                                                employees={employees}
                                                onMove={moveOrder}
                                                onTogglePayment={togglePayment}
                                                onAssignEmployee={assignEmployee}
                                            />
                                        ))}

                                        {allColumnOrders.length === 0 && (
                                            <div className="column-empty">Sin pedidos</div>
                                        )}

                                        {isEntregados && allColumnOrders.length > 10 && (
                                            <button
                                                className="show-more-btn"
                                                onClick={() => setShowAllDelivered(!showAllDelivered)}
                                            >
                                                {showAllDelivered ? 'Ocultar históricos' : `Ver todos (${allColumnOrders.length})`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <ChatCRM />
            )}

            <Toast toast={toast} />
            <WhatsAppModal
                order={whatsappModal}
                onConfirm={handleWhatsAppConfirm}
                onCancel={() => setWhatsappModal(null)}
            />
        </div>
    );
}

// Individual Order Card component
function OrderCard({ order, colId, employees, onMove, onTogglePayment, onAssignEmployee }) {
    const paymentStatus = order.payment_status || 'pendiente';
    const isPaid = paymentStatus === 'pagado';
    const isEntregados = colId === 'entregados';
    const isFirstCol = colId === 'en_revision';
    const isLastCol = colId === 'entregados';

    // Can only move to entregados if paid
    const canMoveNext = !isLastCol && !(COLUMNS[COLUMNS.findIndex(c => c.id === colId) + 1]?.id === 'entregados' && !isPaid);

    const details = order.details;
    const parsedDetails = typeof details === 'string' ? (() => { try { return JSON.parse(details); } catch { return details; } })() : details;

    return (
        <div className={`card card-${order.status || 'nuevos_pedidos'}`}>
            {/* Header: Order # + Payment Tag */}
            <div className="card-header">
                <span className="card-title">Pedido #{order.order_number || order.id}</span>
                <span className={`payment-tag ${paymentStatus}`}>
                    {isPaid ? '✓ Pagado' : 'Pendiente'}
                </span>
            </div>

            {/* Customer Name */}
            {order.customer_name && (
                <div className="card-customer-name">{order.customer_name}</div>
            )}

            {/* Details */}
            <div className="card-details">
                {order.mp_reference && (
                    <div className="card-detail-row">
                        <span><strong>Ref:</strong> {order.mp_reference}</span>
                    </div>
                )}
                <div className="card-detail-row">
                    <PhoneIcon />
                    <span>{order.customer_phone || 'Sin teléfono'}</span>
                </div>
                <div className="card-detail-row">
                    <CalendarIcon />
                    <span>{new Date(order.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {order.delivery_date && (
                    <div className="card-detail-row">
                        <CalendarIcon />
                        <span><strong>Entregado:</strong> {new Date(order.delivery_date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                )}

                {/* Description */}
                {order.description && (
                    <div className="card-description">{order.description}</div>
                )}

                {/* Items from details */}
                {parsedDetails && Array.isArray(parsedDetails) && parsedDetails.length > 0 && (
                    <div className="card-items">
                        {parsedDetails.map((item, i) => (
                            <div key={i} className="item">
                                • {item.title || item.name} ({item.quantity}x)
                            </div>
                        ))}
                    </div>
                )}

                {/* Attachments */}
                {order.attachments && Array.isArray(order.attachments) && order.attachments.length > 0 && (
                    <div className="card-attachments">
                        {order.attachments.map((att, i) => (
                            <a key={i} href={att.url || att} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                📎 {att.name || `Archivo ${i + 1}`}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Employee Assignment */}
            {!isEntregados && (
                <div className="employee-section">
                    <div className="employee-dropdown-wrapper">
                        <select
                            className="employee-select"
                            value={order.assigned_employee || ''}
                            onChange={e => onAssignEmployee(order.id, e.target.value)}
                        >
                            <option value="">Asignar empleado...</option>
                            {employees.map(emp => (
                                <option key={emp} value={emp}>{emp}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Footer: Price + Actions */}
            <div className="card-footer">
                <div className="card-price">
                    ${Number(order.total_price || 0).toLocaleString('es-AR')}
                </div>
                <div className="card-actions">
                    {/* Payment toggle button */}
                    {!isPaid ? (
                        <button
                            className="btn-pay"
                            onClick={() => onTogglePayment(order.id, paymentStatus)}
                            title="Marcar como pagado"
                        >
                            $ Pagado
                        </button>
                    ) : (
                        <button
                            className="btn-unpay"
                            onClick={() => onTogglePayment(order.id, paymentStatus)}
                            title="Desmarcar pago"
                        >
                            $ Impago
                        </button>
                    )}

                    {/* Move buttons */}
                    {!isFirstCol && (
                        <button
                            className="btn-move"
                            onClick={() => onMove(order.id, colId, 'prev')}
                            title="Mover atrás"
                        >
                            ←
                        </button>
                    )}
                    {!isLastCol && (
                        <button
                            className="btn-move"
                            onClick={() => onMove(order.id, colId, 'next')}
                            disabled={!canMoveNext}
                            title={!canMoveNext ? 'Debe estar pagado para entregar' : 'Avanzar etapa'}
                        >
                            →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
