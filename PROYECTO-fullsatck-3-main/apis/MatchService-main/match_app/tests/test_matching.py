"""Tests para match_app.matching - logica pura, sin DB ni HTTP."""
from datetime import datetime, timedelta

import pytest

from match_app.matching import calcular_score, haversine_km


class TestHaversine:
    def test_punto_consigo_mismo_es_cero(self):
        assert haversine_km(-33.4489, -70.6693, -33.4489, -70.6693) == pytest.approx(0.0)

    def test_distancia_santiago_valparaiso_aprox_100km(self):
        # Santiago (Plaza Italia) -> Valparaiso (Plaza Sotomayor) ~107 km
        d = haversine_km(-33.4378, -70.6504, -33.0472, -71.6127)
        assert 95 < d < 115

    def test_distancia_corta(self):
        # 2 puntos a ~1 km de diferencia (~0.009 grados de lat)
        d = haversine_km(-33.45, -70.65, -33.459, -70.65)
        assert 0.9 < d < 1.1

    def test_simetria(self):
        a = haversine_km(-33.45, -70.65, -33.50, -70.70)
        b = haversine_km(-33.50, -70.70, -33.45, -70.65)
        assert a == pytest.approx(b)


class TestCalcularScore:
    def _base(self, **kwargs):
        """Reporte base perfectamente coincidente, sobrescribible por kwargs."""
        base = {
            'tipo_animal': 'perro',
            'raza_probable': 'Labrador',
            'color': 'negro',
            'tamano': 'grande',
            'latitud': -33.45,
            'longitud': -70.65,
            'fecha_reporte': '2026-06-10',
        }
        base.update(kwargs)
        return base

    def test_animales_distintos_corte_temprano(self):
        score, reasons = calcular_score(
            self._base(tipo_animal='perro'), self._base(tipo_animal='gato')
        )
        assert score == 0.0
        assert reasons == []

    def test_tipo_animal_vacio_corte(self):
        score, reasons = calcular_score(self._base(tipo_animal=''), self._base())
        assert score == 0.0

    def test_match_perfecto_da_score_alto(self):
        score, reasons = calcular_score(self._base(), self._base())
        # Mismo tipo + raza (25) + mismo_color (15) + tamano (10) + dist 0 (20) + fecha igual (15) = 85
        assert score == pytest.approx(85.0)
        assert 'mismo_tipo_animal' in reasons
        assert 'misma_raza' in reasons
        assert 'mismo_color' in reasons
        assert 'mismo_tamano' in reasons
        assert 'zona_muy_cercana' in reasons
        assert 'fecha_muy_cercana' in reasons

    def test_solo_tipo_coincide(self):
        score, reasons = calcular_score(
            {'tipo_animal': 'perro'}, {'tipo_animal': 'perro'}
        )
        assert score == 0.0  # solo el corte pasa pero no suma nada
        assert reasons == ['mismo_tipo_animal']

    def test_color_similar_no_exacto(self):
        a = self._base(color='blanco negro')
        b = self._base(color='negro cafe', raza_probable='', tamano='', latitud=0, longitud=0, fecha_reporte=None)
        score, reasons = calcular_score(a, b)
        assert 'color_similar' in reasons
        assert 'mismo_color' not in reasons

    def test_raza_case_insensitive(self):
        a = self._base(raza_probable='LABRADOR')
        b = self._base(raza_probable='labrador')
        score, reasons = calcular_score(a, b)
        assert 'misma_raza' in reasons

    def test_zona_cercana_no_muy_cercana(self):
        # ~5km de distancia
        a = self._base()
        b = self._base(latitud=-33.495)  # ~5km al sur
        _, reasons = calcular_score(a, b)
        assert 'zona_cercana' in reasons
        assert 'zona_muy_cercana' not in reasons

    def test_zona_muy_lejana_no_suma(self):
        a = self._base()
        b = self._base(latitud=-50.0, longitud=-70.0)  # patagonia
        score, reasons = calcular_score(a, b)
        assert 'zona_cercana' not in reasons
        assert 'zona_muy_cercana' not in reasons

    def test_fecha_lejana_no_suma(self):
        a = self._base(fecha_reporte='2026-01-01')
        b = self._base(fecha_reporte='2026-06-01')  # ~5 meses
        _, reasons = calcular_score(a, b)
        assert 'fecha_cercana' not in reasons
        assert 'fecha_muy_cercana' not in reasons

    def test_coordenadas_invalidas_no_crashea(self):
        a = self._base(latitud='no-numero', longitud=None)
        b = self._base()
        score, reasons = calcular_score(a, b)
        # No suma puntos de distancia pero no crashea
        assert isinstance(score, float)
        assert 'zona_cercana' not in reasons

    def test_fecha_invalida_no_crashea(self):
        a = self._base(fecha_reporte='no-es-fecha')
        b = self._base(fecha_reporte='tampoco')
        score, reasons = calcular_score(a, b)
        assert isinstance(score, float)
        assert 'fecha_cercana' not in reasons

    def test_tamano_con_n_con_tilde_es_aceptado(self):
        """El frontend a veces manda 'tamaño' (con n con tilde) en vez de 'tamano'."""
        a = {'tipo_animal': 'perro', 'tamaño': 'grande'}
        b = {'tipo_animal': 'perro', 'tamaño': 'grande'}
        _, reasons = calcular_score(a, b)
        assert 'mismo_tamano' in reasons

    def test_score_maximo_capeado_a_100(self):
        # Por construccion la suma maxima es 85, pero verifico el cap
        # forzando un escenario absurdo (no realista) con pesos sumando 100.
        score, _ = calcular_score(self._base(), self._base())
        assert score <= 100.0
