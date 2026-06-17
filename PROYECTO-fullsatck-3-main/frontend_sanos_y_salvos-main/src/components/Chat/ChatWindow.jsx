import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import './ChatWindow.css';

export default function ChatWindow({ roomName, onBack }) {
  const { user } = useAuth();
  const { isConnected, messages, error, sendMessage } = useChat(roomName);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const userName = user?.full_name || user?.nombre || 'Invitado';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    // Formato exacto que espera ChatConsumer.receive: data['message'], data['sender']
    sendMessage({ message: text, sender: userName });
    setInputValue('');
  };

  // Cada msg que llega desde el WS es {message: "...", sender: "..."}.
  // Tolerante a otros formatos por defensa (string puro, {text, user}, etc.).
  const renderMsg = (msg, idx) => {
    let sender = 'Anonimo';
    let text = '';
    let timestamp = null;
    if (typeof msg === 'string') {
      text = msg;
    } else if (msg && typeof msg === 'object') {
      sender = msg.sender || msg.user || 'Anonimo';
      text = msg.message || msg.text || '';
      timestamp = msg.timestamp || null;
    }
    // Hora HH:MM si el mensaje (del historial) trae timestamp valido.
    let time = '';
    if (timestamp) {
      const d = new Date(timestamp);
      if (!Number.isNaN(d.getTime())) {
        time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    const isMine = sender === userName;
    return (
      <div key={idx} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
        <strong>{sender}{time && <span className="chat-time"> {time}</span>}</strong>
        <p>{text}</p>
      </div>
    );
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        {onBack && (
          <button type="button" className="chat-back-btn" onClick={onBack}>
            {'\u2190'} Volver
          </button>
        )}
        <h3>Sala: {roomName}</h3>
        <span className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">No hay mensajes aun. Se el primero!</p>
        ) : (
          messages.map(renderMsg)
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isConnected ? 'Escribe tu mensaje...' : 'Conectando...'}
          disabled={!isConnected}
          aria-label="Mensaje"
        />
        <button type="submit" disabled={!isConnected || !inputValue.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
