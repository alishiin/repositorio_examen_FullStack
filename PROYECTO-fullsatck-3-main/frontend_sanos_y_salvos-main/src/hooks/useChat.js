import { useState, useEffect, useRef, useCallback } from 'react';
import { chatServiceClient } from '../services/api';

/**
 * Hook para gestionar conexiones de chat por WebSocket
 * @param {string} roomName - Nombre de la sala de chat
 * @returns { ws, isConnected, messages, error, sendMessage }
 */
export const useChat = (roomName) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  // Conectar a la sala
  useEffect(() => {
    if (!roomName) return;

    const connectToChat = async () => {
      try {
        // Validar acceso a la sala
        const validation = await chatServiceClient.validateRoomAccess(roomName);
        
        if (!validation.authorized) {
          setError('No autorizado para acceder a esta sala');
          return;
        }

        // Conectar con WebSocket
        const ws = chatServiceClient.connectToRoom(roomName);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log(`✅ Conectado a sala: ${roomName}`);
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
        };

        ws.onerror = (err) => {
          console.error('❌ WebSocket Error:', err);
          setError('Error de conexión');
        };

        ws.onclose = () => {
          console.log('Desconectado de chat');
          setIsConnected(false);
        };
      } catch (err) {
        console.error('Error conectando a chat:', err);
        setError(err.message);
      }
    };

    connectToChat();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [roomName]);

  // Enviar mensaje.
  // Acepta:
  //   - object: se envia tal cual (caller controla el formato exacto del consumer)
  //   - string: backward-compat, se envuelve en {message, sender:'anonimo'} (formato esperado por ChatConsumer.receive)
  const sendMessage = useCallback((payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Conexion no disponible');
      return;
    }

    try {
      const data = typeof payload === 'object' && payload !== null
        ? payload
        : { message: String(payload), sender: 'anonimo' };
      wsRef.current.send(JSON.stringify(data));
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      setError('Error al enviar mensaje');
    }
  }, []);

  return {
    ws: wsRef.current,
    isConnected,
    messages,
    error,
    sendMessage,
  };
};

export default useChat;
