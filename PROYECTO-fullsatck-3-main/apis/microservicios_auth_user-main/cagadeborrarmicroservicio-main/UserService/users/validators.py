import re
from django.core.exceptions import ValidationError


def validate_chilean_rut(rut):
    """
    Valida RUT chileno en formatos:
    - 12345678-9 (con guion) - Exactamente 8 dígitos
    - 12.345.678-9 (con puntos y guion) - Exactamente 8 dígitos
    """
    # Limpiar espacios
    rut = rut.strip()
    
    # Permitir formato con puntos y guion o solo guion
    # IMPORTANTE: Debe tener exactamente 8 dígitos antes del verificador
    if re.match(r'^\d{2}\.\d{3}\.\d{3}-[K0-9]$', rut):
        # Formato: XX.XXX.XXX-K (ejemplo: 12.345.678-9)
        rut_clean = rut.replace('.', '').replace('-', '')
    elif re.match(r'^\d{8}-[K0-9]$', rut):
        # Formato: XXXXXXXX-K (ejemplo: 12345678-9)
        rut_clean = rut.replace('-', '')
    else:
        raise ValidationError(
            'RUT debe tener exactamente 8 dígitos. Formatos válidos: 12345678-9 o 12.345.678-9'
        )
    
    # Validar dígito verificador
    body = rut_clean[:-1]
    dv = rut_clean[-1].upper()
    
    suma = 0
    multiplier = 2
    for digit in reversed(body):
        suma += int(digit) * multiplier
        multiplier += 1
        if multiplier > 7:
            multiplier = 2
    
    dv_calculado = 11 - (suma % 11)
    
    if dv_calculado == 11:
        dv_calculado = 0
    elif dv_calculado == 10:
        dv_calculado = 'K'
    else:
        dv_calculado = str(dv_calculado)
    
    if str(dv) != str(dv_calculado):
        raise ValidationError('RUT inválido: dígito verificador incorrecto')


def validate_chilean_phone(phone):
    """
    Valida teléfono chileno en formatos:
    - 9 XXXX XXXX (9 dígitos)
    - +56 9 XXXX XXXX
    - 9XXXXXXXX
    """
    phone = phone.strip()
    
    # Formato: +56 9 XXXX XXXX
    if re.match(r'^\+56\s9\s\d{4}\s\d{4}$', phone):
        return
    
    # Formato: 9 XXXX XXXX
    if re.match(r'^9\s\d{4}\s\d{4}$', phone):
        return
    
    # Formato: 9XXXXXXXX
    if re.match(r'^9\d{8}$', phone):
        return
    
    raise ValidationError(
        'Teléfono debe estar en formato: 9 XXXX XXXX, +56 9 XXXX XXXX, o 9XXXXXXXX'
    )
