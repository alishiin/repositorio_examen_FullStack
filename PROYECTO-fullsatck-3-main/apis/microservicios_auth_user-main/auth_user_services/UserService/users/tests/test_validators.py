"""Tests de los validators chilenos (RUT, telefono) - FASE 2A."""
import pytest
from django.core.exceptions import ValidationError
from users.validators import validate_chilean_rut, validate_chilean_phone


class TestValidateChileanRut:
    @pytest.mark.parametrize('rut', [
        '12345678-5',
        '11111111-1',
        '22222222-2',
        '19876543-0',
        '15555555-6',
        '10000000-8',
        '12.345.678-5',  # formato con puntos
    ])
    def test_valid_ruts_pass(self, rut):
        # No debe lanzar.
        validate_chilean_rut(rut)

    @pytest.mark.parametrize('rut', [
        '12345678-9',          # DV incorrecto
        '11111111-9',          # DV incorrecto
        '1234567-5',           # solo 7 digitos
        '123456789-5',         # 9 digitos
        'abcdefgh-5',          # letras
        '12345678',            # sin DV
        '',                    # vacio
        '12-345-678-5',        # formato malo
        '12.345.6789-5',       # puntos mal puestos
    ])
    def test_invalid_ruts_raise(self, rut):
        with pytest.raises(ValidationError):
            validate_chilean_rut(rut)

    def test_dv_k_is_valid(self):
        # RUT cuyo DV calculado es K (vamos a buscar uno).
        # 12345670 -> calc: 1*3+2*4+3*5+4*6+5*7+6*2+7*3+0*4
        #  = 3+8+15+24+35+12+21+0 = 118; 11-(118%11)=11-8=3 -> dv='3'
        # Probemos 20000000:
        # 0*2 *7 + 0*3 + 0*4 + 0*5 + 0*6 + 0*7 + 0*2 + 2*3 = 6, 11-6=5 -> '5'
        # En lugar de calcular a mano, lo derivamos al vuelo:
        def calc_dv(body):
            s = 0
            m = 2
            for d in reversed(body):
                s += int(d) * m
                m = 2 if m == 7 else m + 1
            r = 11 - (s % 11)
            if r == 11:
                return '0'
            if r == 10:
                return 'K'
            return str(r)

        # Buscamos un body cuyo DV sea K.
        for n in range(10000000, 10000200):
            if calc_dv(str(n)) == 'K':
                rut = f'{n}-K'
                validate_chilean_rut(rut)
                return
        pytest.skip('No se encontro RUT con DV=K en el rango de busqueda')

    def test_trims_whitespace(self):
        validate_chilean_rut('  12345678-5  ')


class TestValidateChileanPhone:
    @pytest.mark.parametrize('phone', [
        '9 1234 5678',
        '+56 9 1234 5678',
        '912345678',
    ])
    def test_valid_phones_pass(self, phone):
        validate_chilean_phone(phone)

    @pytest.mark.parametrize('phone', [
        '12345',
        '8 1234 5678',     # no empieza con 9
        '9 1234 567',      # un digito menos
        '+56-9-1234-5678', # guiones
        '',
        'abc',
    ])
    def test_invalid_phones_raise(self, phone):
        with pytest.raises(ValidationError):
            validate_chilean_phone(phone)

    def test_trims_whitespace(self):
        validate_chilean_phone('  9 1234 5678  ')
