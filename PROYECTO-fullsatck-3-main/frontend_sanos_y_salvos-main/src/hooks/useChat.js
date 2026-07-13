import { useState, useEffect, useRef, useCallback } from 'react';
import { chatServiceClient } from '../services/api';

/**
 * Hook para gestionar conexiones de chat por WebSocket.
 *
 * IMPORTANTE — comportamiento bajo React.StrictMode (React 18+ en dev):
 *   StrictMode monta -> desmonta -> remonta cada efecto. Si el cleanup
 *   chequea readyState antes de cerrar el WS, las conexiones en
 *   CONNECTING se filtran y terminamos con 2 sockets vivos en la misma
 *   sala (cada mensaje llega duplicado). Por eso:
 *     - usamos un flag `cancelled` para bloquear handlers stale
 *     - capturamos el WS en una var local del closure
 *     - llamamos close() sin chequear readyState (es seguro en cualquier
 *       estado segun spec WHATWG)
 *
 * @param {string} roomName - Nombre de la sala de chat
 * @returns { ws, isConnected, messages, error, sendMessage }
 */
export const useChat = (roomName) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!roomName) return;

    let cancelled = false;
    let localWs = null;

    const connectToChat = async () => {
      try {
        const validation = await chatServiceClient.validateRoomAccess(roomName);
        if (cancelled) return;

        if (!validation.authorized) {
          setError('No autorizado para acceder a esta sala');
          return;
        }

        const ws = chatServiceClient.connectToRoom(roomName, validation.wsEndpoint || validation.wsUrl);
        localWs = ws;

        // Si fuimos cancelados mientras armabamos la conexion, cerrar.
        if (cancelled) {
          try { ws.close(); } catch { /* noop */ }
          return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) {
            try { ws.close(); } catch { /* noop */ }
            return;
          }
          console.log(`Conectado a sala: ${roomName}`);
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'history') {
              // Reemplaza el state con el historial cargado de la sala.
              setMessages(Array.isArray(data.messages) ? data.messages : []);
            } else {
              setMessages((prev) => [...prev, data]);
            }
          } catch (err) {
            console.error('Error parseando mensaje WS:', err);
          }
        };

        ws.onerror = (err) => {
          if (cancelled) return;
          console.error('WebSocket Error:', err);
          setError('Error de conexion');
        };

        ws.onclose = () => {
          if (cancelled) return;
          console.log('Desconectado de chat');
          setIsConnected(false);
        };
      } catch (err) {
        if (cancelled) return;
        console.error('Error conectando a chat:', err);
        setError(err.message);
      }
    };

    connectToChat();

    return () => {
      cancelled = true;
      // close() es seguro en cualquier readyState (CONNECTING/OPEN/CLOSING/CLOSED).
      // Cerramos AMBAS refs para cubrir cualquier timing.
      try { localWs?.close(); } catch { /* noop */ }
      try { wsRef.current?.close(); } catch { /* noop */ }
      wsRef.current = null;
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
