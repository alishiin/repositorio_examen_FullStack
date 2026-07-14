// src/components/ReportForm/ReportForm.jsx
import { useState, useEffect } from 'react';
import { useGeoService } from '../../hooks/useGeoService';
import { useAuth } from '../../hooks/useAuth';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useMatchAnalysis } from '../../hooks/useMatchAnalysis';
import { matchServiceClient } from '../../services/api';
import './ReportForm.css';

export function ReportForm({ onSuccess }) {
  const { loading, error, createLocation } = useGeoService();
  const { user } = useAuth();
  const { uploadImage, loading: uploadingMedia } = useMediaUpload();
  const { analyzeImage, loading: analyzingMatch, result: matchResult } = useMatchAnalysis();
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_reporte: 'perdido',
    tipo_animal: 'perro',
    raza_probable: '',
    color: '',
    tamaño: 'mediano',
    latitud: -33.8688,
    longitud: -71.2093,
    zona_descripcion: 'Santiago, Chile',
    fecha_reporte: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!formData.titulo.trim()) {
      setFormError('El título es requerido');
      return false;
    }
    if (!formData.descripcion.trim()) {
      setFormError('La descripción es requerida');
      return false;
    }
    if (isNaN(formData.latitud) || isNaN(formData.longitud)) {
      setFormError('Latitud y longitud deben ser números válidos');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      let imagen_url = null;
      if (imageFile) {
        const uploadResult = await uploadImage(imageFile, formData.titulo);
        imagen_url = uploadResult?.image_url || uploadResult?.image || null;

        // Análisis Match en paralelo (no bloquea el reporte)
        analyzeImage(`rep_${Date.now()}`, formData.tipo_animal, imageFile).catch(err => {
          console.warn('Análisis Match falló (no crítico):', err);
        });
      }

      const result = await createLocation({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo_reporte: formData.tipo_reporte,
        tipo_animal: formData.tipo_animal,
        raza_probable: formData.raza_probable,
        color: formData.color,
        tamaño: formData.tamaño,
        latitud: parseFloat(formData.latitud),
        longitud: parseFloat(formData.longitud),
        fecha_reporte: formData.fecha_reporte,
        usuario_id: user?.id || user?.usuario_id || user?.uid || 'anonymous',
        imagen_url,
      });

      // Auto-busqueda de coincidencias en segundo plano (no bloqueante).
      // El backend persiste matches y dispara notificaciones a los otros autores.
      const newReportId = result?.reporte_id || result?.id;
      if (newReportId) {
        matchServiceClient.findMatches({
          report_id: String(newReportId),
          tipo_reporte: formData.tipo_reporte,
          tipo_animal: formData.tipo_animal,
          raza_probable: formData.raza_probable,
          color: formData.color,
          tamano: formData.tamaño,
          latitud: parseFloat(formData.latitud),
          longitud: parseFloat(formData.longitud),
          fecha_reporte: formData.fecha_reporte,
          titulo: formData.titulo,
          imagen_url: imagen_url,
          user_id: user?.id || user?.usuario_id,
        }).then((r) => {
          if (r?.matches?.length) {
            console.log(`${r.matches.length} coincidencias auto-detectadas`);
          }
        }).catch((e) => console.warn('Auto-match fallo (no critico):', e?.message));
      }

      setSuccessMessage('Reporte creado exitosamente! Se publicara en el mapa.');
      
      // Resetear formulario
      setFormData({
        titulo: '',
        descripcion: '',
        tipo_reporte: 'perdido',
        tipo_animal: 'perro',
        raza_probable: '',
        color: '',
        tamaño: 'mediano',
        latitud: -33.8688,
        longitud: -71.2093,
        zona_descripcion: 'Santiago, Chile',
        fecha_reporte: new Date().toISOString().split('T')[0],
      });
      setImageFile(null);
      setImagePreview(null);

      window.dispatchEvent(new CustomEvent('sanos-y-salvos:report-created', {
        detail: {
          reporte_id: newReportId,
          tipo_reporte: formData.tipo_reporte,
        },
      }));

      // Callback si existe
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err) {
      setFormError(err.message || 'Error al crear el reporte');
    }
  };

  return (
    <div className="report-form-container">
      <form onSubmit={handleSubmit} className="report-form">
        
        {/* User Info Banner */}
        {user && (
          <div className="user-info-banner">
            <span>📱 Reportando como:</span>
            <strong>{user?.full_name || user?.nombre || 'Usuario'}</strong>
          </div>
        )}

        {/* Alert Messages */}
        {formError && <div className="alert alert-error">{formError}</div>}
        {successMessage && <div className="alert alert-success"> {successMessage}</div>}
        {error && <div className="alert alert-error"> {error}</div>}
        {analyzingMatch && <div className="alert alert-info">⏳ Analizando imagen con IA…</div>}
        {matchResult && (
          <div className="match-result-card">
            <h4> Análisis IA de la imagen</h4>
            <p><strong>Descripción automática:</strong> {matchResult.descripcion_automatica}</p>
          </div>
        )}

        {/* Row 1: Tipo de Reporte y Tipo de Animal */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tipo_reporte">Tipo de Reporte *</label>
            <select
              id="tipo_reporte"
              name="tipo_reporte"
              value={formData.tipo_reporte}
              onChange={handleChange}
              className="form-select"
            >
              <option value="perdido">🔍 Perdido</option>
              <option value="encontrado">✅ Encontrado</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tipo_animal">Tipo de Animal *</label>
            <select
              id="tipo_animal"
              name="tipo_animal"
              value={formData.tipo_animal}
              onChange={handleChange}
              className="form-select"
            >
              <option value="perro">🐕 Perro</option>
              <option value="gato">🐱 Gato</option>
              <option value="otro">🐾 Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tamaño">Tamaño</label>
            <select
              id="tamaño"
              name="tamaño"
              value={formData.tamaño}
              onChange={handleChange}
              className="form-select"
            >
              <option value="pequeño">🤏 Pequeño</option>
              <option value="mediano">📏 Mediano</option>
              <option value="grande">🦣 Grande</option>
            </select>
          </div>
        </div>

        {/* Row 2: Título */}
        <div className="form-group full-width">
          <label htmlFor="titulo">Título del Reporte *</label>
          <input
            id="titulo"
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ej: Perro perdido - Golden Retriever dorado"
            className="form-input"
            maxLength="100"
          />
          <small>{formData.titulo.length}/100</small>
        </div>

        {/* Row 3: Descripción */}
        <div className="form-group full-width">
          <label htmlFor="descripcion">Descripción Detallada *</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Describe al animal, dónde fue visto, cualquier característica especial, última vez visto, etc..."
            className="form-textarea"
            rows="4"
            maxLength="500"
          />
          <small>{formData.descripcion.length}/500</small>
        </div>

        {/* Row 4: Características */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="raza_probable">Raza Probable</label>
            <input
              id="raza_probable"
              type="text"
              name="raza_probable"
              value={formData.raza_probable}
              onChange={handleChange}
              placeholder="Ej: Labrador, Criollo, Indefinida"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              id="color"
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Ej: Blanco y negro, Café"
              className="form-input"
            />
          </div>
        </div>

        {/* Row 5: Foto de la mascota (opcional) */}
        <div className="form-group full-width">
          <label htmlFor="image"> Foto de la mascota (opcional)</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="form-input"
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Vista previa" />
            </div>
          )}
        </div>

        {/* Row 6: Ubicación */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="latitud">Latitud *</label>
            <input
              id="latitud"
              type="number"
              name="latitud"
              value={formData.latitud}
              onChange={handleChange}
              placeholder="-33.8688"
              className="form-input"
              step="0.0001"
            />
          </div>

          <div className="form-group">
            <label htmlFor="longitud">Longitud *</label>
            <input
              id="longitud"
              type="number"
              name="longitud"
              value={formData.longitud}
              onChange={handleChange}
              placeholder="-71.2093"
              className="form-input"
              step="0.0001"
            />
          </div>

          <div className="form-group">
            <label htmlFor="zona_descripcion">Zona / Dirección</label>
            <input
              id="zona_descripcion"
              type="text"
              name="zona_descripcion"
              value={formData.zona_descripcion}
              onChange={handleChange}
              placeholder="Ej: Providencia, Santiago"
              className="form-input"
            />
          </div>
        </div>

        {/* Row 7: Fecha */}
        <div className="form-group">
          <label htmlFor="fecha_reporte">Fecha del Reporte</label>
          <input
            id="fecha_reporte"
            type="date"
            name="fecha_reporte"
            value={formData.fecha_reporte}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || uploadingMedia}
          className="submit-btn"
        >
          {uploadingMedia
            ? '⏳ Subiendo imagen...'
            : loading
              ? '⏳ Publicando...'
              : ' Publicar Reporte'}
        </button>

        <p className="form-note">* Campos requeridos</p>
      </form>
    </div>
  );
}
