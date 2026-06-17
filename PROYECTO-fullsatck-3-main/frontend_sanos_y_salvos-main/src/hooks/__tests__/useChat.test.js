/**
 * Tests useChat con WebSocket mockeado.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  chatServiceClient: {
    validateRoomAccess: vi.fn(),
    connectToRoom: vi.fn(),
  },
}));

import { chatServiceClient } from '../../services/api';
import useChat from '../useChat';

// MockWS simple con triggers manuales.
class MockWS {
  constructor() {
    this.readyState = 1; // OPEN
    this.sent = [];
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }
  send(data) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
  _triggerOpen() {
    if (this.onopen) this.onopen();
  }
  _triggerMessage(data) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }
  _triggerError(err) {
    if (this.onerror) this.onerror(err);
  }
}

// Necesitamos WebSocket.OPEN global (lo lee el cleanup del hook).
beforeEach(() => {
  globalThis.WebSocket = { OPEN: 1, CLOSED: 3, CLOSING: 2, CONNECTING: 0 };
  chatServiceClient.validateRoomAccess.mockReset();
  chatServiceClient.connectToRoom.mockReset();
});

describe('useChat', () => {
  test('no conecta si roomName es falsy', () => {
    renderHook(() => useChat(null));
    expect(chatServiceClient.validateRoomAccess).not.toHaveBeenCalled();
  });

  test('conexion exitosa: estado isConnected pasa a true', async () => {
    const mockWs = new MockWS();
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);

    const { result } = renderHook(() => useChat('sala-1'));

    await waitFor(() => {
      expect(chatServiceClient.connectToRoom).toHaveBeenCalledWith('sala-1');
    });
    act(() => mockWs._triggerOpen());
    expect(result.current.isConnected).toBe(true);
  });

  test('mensajes recibidos se agregan al state', async () => {
    const mockWs = new MockWS();
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);
    const { result } = renderHook(() => useChat('sala-1'));
    await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());

    act(() => mockWs._triggerOpen());
    act(() => mockWs._triggerMessage({ message: 'hola', sender: 'alice' }));
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual({ message: 'hola', sender: 'alice' });
  });

  test('mensaje type:history reemplaza el state con el array', async () => {
    const mockWs = new MockWS();
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);
    const { result } = renderHook(() => useChat('sala-1'));
    await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());
    act(() => mockWs._triggerOpen());

    // Primero llega un mensaje normal...
    act(() => mockWs._triggerMessage({ message: 'previo', sender: 'x' }));
    expect(result.current.messages).toHaveLength(1);

    // ...luego el historial: debe REEMPLAZAR, no hacer append.
    const history = [
      { message: 'm1', sender: 'a', timestamp: '2026-01-01T10:00:00Z' },
      { message: 'm2', sender: 'b', timestamp: '2026-01-01T10:01:00Z' },
    ];
    act(() => mockWs._triggerMessage({ type: 'history', messages: history }));
    expect(result.current.messages).toEqual(history);
  });

  test('historia con messages no-array cae a array vacio', async () => {
    const mockWs = new MockWS();
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);
    const { result } = renderHook(() => useChat('sala-1'));
    await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());
    act(() => mockWs._triggerOpen());

    act(() => mockWs._triggerMessage({ type: 'history', messages: null }));
    expect(result.current.messages).toEqual([]);
  });

  test('mensaje normal despues de historial hace append', async () => {
    const mockWs = new MockWS();
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);
    const { result } = renderHook(() => useChat('sala-1'));
    await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());
    act(() => mockWs._triggerOpen());

    act(() => mockWs._triggerMessage({ type: 'history', messages: [{ message: 'h1', sender: 'a' }] }));
    act(() => mockWs._triggerMessage({ message: 'nuevo', sender: 'b' }));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toEqual({ message: 'nuevo', sender: 'b' });
  });

  test('sin autorizacion setea error', async () => {
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: false });
    const { result } = renderHook(() => useChat('sala-x'));
    await waitFor(() => expect(result.current.error).toMatch(/autorizado/));
    expect(chatServiceClient.connectToRoom).not.toHaveBeenCalled();
  });

  test('error en validacion setea error', async () => {
    chatServiceClient.validateRoomAccess.mockRejectedValue(new Error('boom validate'));
    const { result } = renderHook(() => useChat('sala-x'));
    await waitFor(() => expect(result.current.error).toBe('boom validate'));
  });

  test('ws.onerror setea error', async () => {
    const mockWs = new MockWS();
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);
    const { result } = renderHook(() => useChat('s'));
    await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());
    act(() => mockWs._triggerError(new Error('ws fail')));
    expect(result.current.error).toMatch(/Error de conexi/);
  });

  test('sendMessage con object pasa por JSON', async () => {
    const mockWs = new MockWS();
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);
    const { result } = renderHook(() => useChat('s'));
    await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());
    act(() => mockWs._triggerOpen());

    act(() => result.current.sendMessage({ message: 'hi', sender: 'a' }));
    expect(mockWs.sent).toHaveLength(1);
    expect(JSON.parse(mockWs.sent[0])).toEqual({ message: 'hi', sender: 'a' });
  });

  test('sendMessage con string envuelve en {message, sender:anonimo}', async () => {
    const mockWs = new MockWS();
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);
    const { result } = renderHook(() => useChat('s'));
    await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());
    act(() => mockWs._triggerOpen());

    act(() => result.current.sendMessage('hola'));
    expect(JSON.parse(mockWs.sent[0])).toEqual({ message: 'hola', sender: 'anonimo' });
  });

  test('sendMessage con WS cerrado setea error', async () => {
    const mockWs = new MockWS();
    mockWs.readyState = 3; // CLOSED
    chatServiceClient.validateRoomAccess.mockResolvedValue({ authorized: true });
    chatServiceClient.connectToRoom.mockReturnValue(mockWs);
    const { result } = renderHook(() => useChat('s'));
    await waitFor(() => expect(chatServiceClient.connectToRoom).toHaveBeenCalled());

    act(() => result.current.sendMessage('hola'));
    expect(result.current.error).toMatch(/no disponible/);
    expect(mockWs.sent).toHaveLength(0);
  });
});
