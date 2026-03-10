import { useState, useEffect, useRef } from 'react';
import '../index.css';

const API_URL = `http://${window.location.hostname}:3002`;

export default function ChatCRM() {
    const [conversations, setConversations] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionData, setSessionData] = useState(null); // { history, status, unread_count, needs_intervention }
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Fetch conversations list
    const fetchConversations = async () => {
        try {
            const res = await fetch(`${API_URL}/conversations`);
            const data = await res.json();
            if (data.success) {
                setConversations(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch conversations", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch specific conversation history
    const fetchSessionData = async (sessionId) => {
        try {
            const res = await fetch(`${API_URL}/conversations/${sessionId}`);
            const data = await res.json();
            if (data.success) {
                setSessionData(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch session data", err);
        }
    };

    // Polling interval
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(() => {
            fetchConversations();
            if (selectedSession) {
                fetchSessionData(selectedSession);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedSession]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sessionData?.history]);

    const handleSelectConversation = async (sessionId) => {
        setSelectedSession(sessionId);
        setSessionData(null); // clear while loading
        await fetchSessionData(sessionId);

        // Mark as read when selected
        const conv = conversations.find(c => c.session_id === sessionId);
        if (conv && conv.unread_count > 0) {
            await fetch(`${API_URL}/conversations/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unread_count: 0 })
            });
            fetchConversations();
        }
    };

    const toggleBotStatus = async () => {
        if (!sessionData) return;
        const newStatus = sessionData.status === 'paused' ? 'active' : 'paused';

        // Optimistic UI update
        setSessionData({ ...sessionData, status: newStatus });

        try {
            await fetch(`${API_URL}/conversations/${selectedSession}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchConversations();
        } catch (err) {
            console.error("Failed to toggle status", err);
            // Revert on failure
            setSessionData({ ...sessionData, status: sessionData.status });
        }
    };

    const clearIntervention = async () => {
        if (!sessionData) return;
        setSessionData({ ...sessionData, needs_intervention: false });
        try {
            await fetch(`${API_URL}/conversations/${selectedSession}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ needs_intervention: false })
            });
            fetchConversations();
        } catch (err) {
            console.error("Failed to clear intervention", err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedSession) return;

        const text = messageInput;
        setMessageInput('');

        // Optimistic UI update
        const newHistory = [...(sessionData?.history || []), { role: 'assistant', content: text }];
        setSessionData({ ...sessionData, history: newHistory, status: 'paused', needs_intervention: false });

        try {
            await fetch(`${API_URL}/conversations/${selectedSession}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            fetchConversations();
        } catch (err) {
            console.error("Failed to send message", err);
            alert("Error enviando mensaje. Revisa configuración de Evolution API.");
            fetchSessionData(selectedSession); // Refresh
        }
    };

    if (loading) return <div className="loading">Cargando CRM...</div>;

    return (
        <div className="crm-container">
            {/* Sidebar */}
            <div className="crm-sidebar">
                <div className="crm-sidebar-header">
                    <h2>Conversaciones</h2>
                </div>
                <div className="crm-conversation-list">
                    {conversations.length === 0 ? (
                        <div className="crm-empty-state">No hay conversaciones activas</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.session_id}
                                className={`crm-conversation-item ${selectedSession === conv.session_id ? 'active' : ''}`}
                                onClick={() => handleSelectConversation(conv.session_id)}
                            >
                                <div className="crm-conv-info">
                                    <div className="crm-conv-name">{conv.session_id}</div>
                                    <div className="crm-conv-meta">
                                        <span className={`crm-status-dot ${conv.status}`}></span>
                                        {conv.status === 'paused' ? 'Bot Pausado' : 'Bot Activo'}
                                    </div>
                                </div>
                                <div className="crm-conv-badges">
                                    {conv.needs_intervention && (
                                        <span className="badge warning" title="Requiere Atención">⚠️</span>
                                    )}
                                    {conv.unread_count > 0 && (
                                        <span className="badge unread">{conv.unread_count}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="crm-main">
                {selectedSession ? (
                    sessionData ? (
                        <>
                            {/* Chat Header */}
                            <div className="crm-chat-header">
                                <div className="crm-chat-title">{selectedSession}</div>
                                <div className="crm-chat-actions">
                                    {sessionData.needs_intervention && (
                                        <button className="btn-action btn-clear" onClick={clearIntervention} title="Ocultar advertencia">
                                            ✅ Atendido
                                        </button>
                                    )}
                                    <button
                                        className={`btn-action ${sessionData.status === 'paused' ? 'btn-resume' : 'btn-pause'}`}
                                        onClick={toggleBotStatus}
                                    >
                                        {sessionData.status === 'paused' ? '▶ Reanudar Bot' : '⏸ Pausar Bot'}
                                    </button>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="crm-chat-messages">
                                {sessionData.history && sessionData.history.length > 0 ? (
                                    sessionData.history.map((msg, idx) => (
                                        <div key={idx} className={`crm-message ${msg.role === 'user' ? 'msg-user' : 'msg-bot'}`}>
                                            <div className="msg-bubble">
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="crm-empty-state">No hay mensajes en esta sesión.</div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="crm-chat-input-area">
                                <form onSubmit={sendMessage} className="crm-input-form">
                                    <input
                                        type="text"
                                        placeholder="Escribe un mensaje..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        className="crm-input"
                                    />
                                    <button type="submit" className="crm-btn-send" disabled={!messageInput.trim()}>
                                        Enviar
                                    </button>
                                </form>
                                {sessionData.status !== 'paused' && (
                                    <div className="crm-input-hint">⚠️ Enviar un mensaje pausará el bot automáticamente.</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="loading">Cargando conversación...</div>
                    )
                ) : (
                    <div className="crm-no-selection">
                        <div className="crm-no-selection-content">
                            <h3>Axis CRM</h3>
                            <p>Selecciona una conversación para ver los mensajes.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
