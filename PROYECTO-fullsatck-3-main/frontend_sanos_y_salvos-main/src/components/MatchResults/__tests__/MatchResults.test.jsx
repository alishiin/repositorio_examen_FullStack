/**
 * Tests MatchResults - render puro, sin mocks externos.
 */
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchResults from '../MatchResults';

const sample = [
  {
    score: 85,
    reasons: ['misma_raza', 'zona_muy_cercana', 'mismo_color'],
    reporte: {
      id: 1,
      reporte_id: 'rep_1',
      titulo: 'Toby Labrador',
      tipo_reporte: 'encontrado',
    },
  },
  {
    score: 58,
    reasons: ['color_similar', 'fecha_cercana'],
    reporte: {
      id: 2,
      reporte_id: 'rep_2',
      titulo: 'Gato pequeno',
      tipo_reporte: 'perdido',
      imagen_url: 'http://x/y.jpg',
    },
  },
];

describe('MatchResults', () => {
  test('estado loading muestra spinner', () => {
    render(<MatchResults matches={[]} loading={true} />);
    expect(screen.getByText(/Buscando coincidencias/i)).toBeInTheDocument();
  });

  test('estado vacio muestra mensaje sin coincidencias', () => {
    render(<MatchResults matches={[]} loading={false} />);
    expect(screen.getByText(/No se encontraron coincidencias/i)).toBeInTheDocument();
    // Hint explicativo del cruce perdido<->encontrado
    expect(screen.getByText(/cruza reportes/i)).toBeInTheDocument();
  });

  test('renderiza lista de matches con titulos y scores', () => {
    render(<MatchResults matches={sample} loading={false} />);
    expect(screen.getByText('Toby Labrador')).toBeInTheDocument();
    expect(screen.getByText('Gato pequeno')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('58%')).toBeInTheDocument();
  });

  test('traduce razones a labels en espanol', () => {
    render(<MatchResults matches={sample} loading={false} />);
    expect(screen.getByText('Misma raza')).toBeInTheDocument();
    expect(screen.getByText(/Muy cerca/i)).toBeInTheDocument();
    expect(screen.getByText('Color similar')).toBeInTheDocument();
  });

  test('muestra badge de tipo de reporte', () => {
    render(<MatchResults matches={sample} loading={false} />);
    expect(screen.getByText('Encontrado')).toBeInTheDocument();
    expect(screen.getByText('Perdido')).toBeInTheDocument();
  });

  test('click en una card invoca onMatchClick', () => {
    const onClick = vi.fn();
    render(<MatchResults matches={sample} loading={false} onMatchClick={onClick} />);
    fireEvent.click(screen.getByText('Toby Labrador'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].score).toBe(85);
  });

  test('sin onMatchClick las cards no son interactivas', () => {
    const { container } = render(<MatchResults matches={sample} loading={false} />);
    const cards = container.querySelectorAll('.match-card');
    cards.forEach((c) => expect(c.getAttribute('role')).toBeNull());
  });

  test('razon desconocida se renderiza tal cual', () => {
    render(
      <MatchResults
        matches={[{ score: 60, reasons: ['inventada'], reporte: { id: 9, titulo: 'X' } }]}
        loading={false}
      />,
    );
    expect(screen.getByText('inventada')).toBeInTheDocument();
  });
});
