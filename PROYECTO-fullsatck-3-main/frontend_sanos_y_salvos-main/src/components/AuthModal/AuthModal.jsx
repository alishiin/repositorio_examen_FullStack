import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { COMUNAS_RM } from '../../constants/comunas';
import UiDialog from '../UiDialog/UiDialog';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    contraseña_confirmar: '',
    rut: '',
    telefono: '',
    comuna: '',
    dirección: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, tone: 'info', title: '', message: '' });

  const USER_API = import.meta.env.VITE_USER_SERVICE_URL || "http://127.0.0.1:8002"
  const AUTH_API = import.meta.env.VITE_AUTH_SERVICE_URL || "http://127.0.0.1:8001"

  // Validar RUT chileno (8-9 dígitos: 7-8 dígitos base + 1 dígito verificador)
  const validateRUT = (rut) => {
    if (!rut) return false;
    // Solo números (sin guión ni puntos)
    const rutLimpio = rut.replace(/[^0-9]/g, '');
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }
    return true;
  };

  // Formatear RUT chileno: XX.XXX.XXX-X
  const formatRUT = (rut) => {
    const rutLimpio = rut.replace(/[^0-9]/g, '');
    if (rutLimpio.length > 9) return rut;
    
    if (rutLimpio.length <= 1) {
      return rutLimpio;
    }
    
    // Formato específico chileno: XX.XXX.XXX-X
    if (rutLimpio.length === 9) {
      const parte1 = rutLimpio.substring(0, 2);
      const parte2 = rutLimpio.substring(2, 5);
      const parte3 = rutLimpio.substring(5, 8);
      const verificador = rutLimpio.substring(8, 9);
      return `${parte1}.${parte2}.${parte3}-${verificador}`;
    }
    
    // Formato progresivo mientras se escribe
    if (rutLimpio.length <= 2) {
      return rutLimpio;
    } else if (rutLimpio.length <= 5) {
      return rutLimpio.substring(0, 2) + '.' + rutLimpio.substring(2);
    } else if (rutLimpio.length <= 8) {
      return rutLimpio.substring(0, 2) + '.' + rutLimpio.substring(2, 5) + '.' + rutLimpio.substring(5);
    } else {
      return rutLimpio.substring(0, 2) + '.' + rutLimpio.substring(2, 5) + '.' + rutLimpio.substring(5, 8) + '-' + rutLimpio.substring(8);
    }
  };

  // Validar teléfono chileno
  const validatePhoneChile = (phone) => {
    const phoneLimpio = phone.replace(/[^0-9]/g, '');
    return phoneLimpio.length === 9 && phoneLimpio.startsWith('9');
  };

  // Formatear teléfono chileno: 9 XXXX XXXX
  const formatPhoneChile = (phone) => {
    const phoneLimpio = phone.replace(/[^0-9]/g, '');
    if (phoneLimpio.length === 0) return '';
    if (phoneLimpio.length <= 1) return phoneLimpio;
    if (phoneLimpio.length <= 5) return phoneLimpio.slice(0, 1) + ' ' + phoneLimpio.slice(1);
    return phoneLimpio.slice(0, 1) + ' ' + phoneLimpio.slice(1, 5) + ' ' + phoneLimpio.slice(5, 9);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validar RUT: solo números y formatear automáticamente
    if (name === 'rut') {
      const rutLimpio = value.replace(/[^0-9]/g, '');
      if (rutLimpio.length <= 9) {
        setFormData(prev => ({
          ...prev,
          [name]: formatRUT(rutLimpio)
        }));
      }
      return;
    }

    // Validar teléfono: solo números y formatear automáticamente
    if (name === 'telefono') {
      const phoneLimpio = value.replace(/[^0-9]/g, '');
      if (phoneLimpio.length <= 9) {
        setFormData(prev => ({
          ...prev,
          [name]: formatPhoneChile(phoneLimpio)
        }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.correo || !formData.contraseña) {
      setError('Correo y contraseña son requeridos');
      return false;
    }
    if (!isLogin) {
      if (!formData.nombre || !formData.rut || !formData.telefono || !formData.comuna || !formData.dirección) {
        setError('Todos los campos son requeridos para registrarse');
        return false;
      }
      if (!validateRUT(formData.rut)) {
        setError('RUT inválido. Use formato: XX.XXX.XXX-X');
        return false;
      }
      if (!validatePhoneChile(formData.telefono)) {
        setError('Teléfono inválido. Use formato: 9 XXXX XXXX');
        return false;
      }
      if (formData.correo.length < 5 || !formData.correo.includes('@')) {
        setError('Correo inválido');
        return false;
      }
      if (formData.contraseña.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return false;
      }
      if (formData.contraseña !== formData.contraseña_confirmar) {
        setError('Las contraseñas no coinciden');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await fetch(`${USER_API}/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.correo,
            password: formData.contraseña,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Error en login');
        }

        const data = await response.json();
        
        login(data.user || { nombre: formData.nombre }, data.token);

        setDialog({ open: true, tone: 'success', title: 'Sesión iniciada', message: '¡Bienvenido! Tu sesión quedó activa.' });
        onClose();
      } else {
        // Registro nuevo
        const username = formData.correo.split('@')[0]; // Generar username del email
        
        const response = await fetch(`${USER_API}/users/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            email: formData.correo,
            password: formData.contraseña,
            full_name: formData.nombre,
            rut: formData.rut.replace(/[^0-9-]/g, ''), // Limpiar el RUT
            phone: formData.telefono,
            commune: formData.comuna,
            address: formData.dirección,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          // Procesar errores del backend
          const errorMessages = [];
          if (data.username) errorMessages.push(`Usuario: ${data.username[0]}`);
          if (data.email) errorMessages.push(`Email: ${data.email[0]}`);
          if (data.password) errorMessages.push(`Contraseña: ${data.password[0]}`);
          if (data.rut) errorMessages.push(`RUT: ${data.rut[0]}`);
          if (data.phone) errorMessages.push(`Teléfono: ${data.phone[0]}`);
          if (data.full_name) errorMessages.push(`Nombre: ${data.full_name[0]}`);
          if (data.commune) errorMessages.push(`Comuna: ${data.commune[0]}`);
          if (data.address) errorMessages.push(`Dirección: ${data.address[0]}`);
          
          throw new Error(errorMessages.join(' | ') || 'Error en registro');
        }

        const data = await response.json();
        
        if (data.token) {
          login(data, data.token);
          setDialog({ open: true, tone: 'success', title: 'Registro completado', message: 'Tu sesión quedó iniciada.' });
          onClose();
        } else {
          setDialog({ open: true, tone: 'success', title: 'Registro completado', message: 'Ahora puedes iniciar sesión con tu nueva cuenta.' });
          setIsLogin(true);
        }
        
        setFormData({
          nombre: '',
          correo: '',
          contraseña: '',
          contraseña_confirmar: '',
          rut: '',
          telefono: '',
          comuna: '',
          dirección: ''
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
          >
            Iniciar Sesión
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  placeholder="Juan Pérez"
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rut">RUT (Sin puntos ni guión)</label>
                  <input
                    type="text"
                    id="rut"
                    name="rut"
                    placeholder="21996197-9"
                    value={formData.rut}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength="12"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="text"
                    id="telefono"
                    name="telefono"
                    placeholder="9 XXXX XXXX"
                    value={formData.telefono}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength="12"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="comuna">Comuna</label>
                  <select
                    id="comuna"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  >
                    <option value="">Selecciona tu comuna</option>
                    {COMUNAS_RM.map((comuna) => (
                      <option key={comuna} value={comuna}>{comuna}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dirección">Dirección</label>
                <input
                  type="text"
                  id="dirección"
                  name="dirección"
                  placeholder="Calle Principal 123, Apartamento 4"
                  value={formData.dirección}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input
              type="text"
              id="correo"
              name="correo"
              placeholder="tu@correo.com"
              value={formData.correo}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contraseña">Contraseña</label>
            <input
              type="password"
              id="contraseña"
              name="contraseña"
              placeholder="••••••••"
              value={formData.contraseña}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="contraseña_confirmar">Confirmar Contraseña</label>
              <input
                type="password"
                id="contraseña_confirmar"
                name="contraseña_confirmar"
                placeholder="••••••••"
                value={formData.contraseña_confirmar}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="auth-toggle-btn"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión aquí'}
            </button>
          </p>
        </div>
      </div>

      <UiDialog
        open={dialog.open}
        tone={dialog.tone}
        title={dialog.title}
        message={dialog.message}
        confirmLabel="Aceptar"
        onConfirm={() => setDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
