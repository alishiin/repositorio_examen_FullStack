import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import ChatRoomList from '../components/Chat/ChatRoomList';
import ChatWindow from '../components/Chat/ChatWindow';
import './chat.css';

export default function Chat() {
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState(null);

  if (!user) {
    return (
      <div className="chat-page">
        <div className="chat-auth-required">
          <h2>
            <span aria-hidden="true">{'\u{1F512}'}</span> Inicia sesion para chatear
          </h2>
          <p>El chat es exclusivo para usuarios registrados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {activeRoom ? (
        <ChatWindow roomName={activeRoom} onBack={() => setActiveRoom(null)} />
      ) : (
        <ChatRoomList onSelectRoom={setActiveRoom} />
      )}
    </div>
  );
}
