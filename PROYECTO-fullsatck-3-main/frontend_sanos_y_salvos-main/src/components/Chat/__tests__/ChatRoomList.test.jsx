/**
 * Tests ChatRoomList — UI puro, sin mocks externos.
 */
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatRoomList from '../ChatRoomList';

describe('ChatRoomList', () => {
  test('renderiza las 5 salas predefinidas', () => {
    render(<ChatRoomList onSelectRoom={vi.fn()} />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Perros perdidos')).toBeInTheDocument();
    expect(screen.getByText('Gatos perdidos')).toBeInTheDocument();
    expect(screen.getByText('Avistamientos')).toBeInTheDocument();
    expect(screen.getByText('Veterinarias')).toBeInTheDocument();
  });

  test('click en sala predefinida invoca callback con su slug', () => {
    const onSelect = vi.fn();
    render(<ChatRoomList onSelectRoom={onSelect} />);
    fireEvent.click(screen.getByText('Perros perdidos'));
    expect(onSelect).toHaveBeenCalledWith('perros-perdidos');
  });

  test('crea sala custom slugificando el input', () => {
    const onSelect = vi.fn();
    render(<ChatRoomList onSelectRoom={onSelect} />);
    const input = screen.getByPlaceholderText('nombre-de-sala');
    fireEvent.change(input, { target: { value: 'Mi Sala Cool!!!' } });
    fireEvent.click(screen.getByText('Entrar a la sala'));
    expect(onSelect).toHaveBeenCalledWith('mi-sala-cool');
  });

  test('input vacio no dispara callback', () => {
    const onSelect = vi.fn();
    render(<ChatRoomList onSelectRoom={onSelect} />);
    fireEvent.click(screen.getByText('Entrar a la sala'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
