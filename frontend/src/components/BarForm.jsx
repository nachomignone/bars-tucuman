import { useState } from 'react';
import { useCreateBar, useUpdateBar } from '../hooks/useBares';

const CATEGORIAS = ['Bar', 'Boliche', 'Café', 'Recital', 'Otro'];

const FORM_INICIAL = {
  nombre: '',
  ubicacion: '',
  categoria: '',
  telefono: '',
  horario: '',
  fuente: 'investigación_manual',
  notas: '',
};

const BarForm = ({ barAEditar, onCerrar }) => {
  const modoEdicion = Boolean(barAEditar);

  const [formData, setFormData] = useState(
    modoEdicion
      ? {
          nombre: barAEditar.nombre || '',
          ubicacion: barAEditar.ubicacion || '',
          categoria: barAEditar.categoria || '',
          telefono: barAEditar.telefono || '',
          horario: barAEditar.horario || '',
          fuente: barAEditar.fuente || 'investigación_manual',
          notas: barAEditar.notas || '',
        }
      : FORM_INICIAL
  );

  const [avisos, setAvisos] = useState([]);

  const createBar = useCreateBar();
  const updateBar = useUpdateBar();

  const mutation = modoEdicion ? updateBar : createBar;
  const isPending = mutation.isPending;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAvisos([]);

    const payload = modoEdicion
      ? { id: barAEditar._id, ...formData }
      : formData;

    mutation.mutate(payload, {
      onSuccess: (data) => {
        if (data.avisos?.length) setAvisos(data.avisos);
        else onCerrar();
      },
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.titulo}>
            {modoEdicion ? '✏️ Editar Bar' : '➕ Nuevo Bar'}
          </h2>
          <button style={styles.btnCerrar} onClick={onCerrar}>✕</button>
        </div>

        {/* Avisos de duplicados */}
        {avisos.length > 0 && (
          <div style={styles.avisoBox}>
            {avisos.map((a, i) => (
              <p key={i} style={styles.avisoTexto}>{a}</p>
            ))}
            <button style={styles.btnContinuar} onClick={onCerrar}>
              Entendido, cerrar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.campo}>
            <label style={styles.label}>Nombre *</label>
            <input
              style={styles.input}
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Ej: Bar El Español"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Ubicación *</label>
            <input
              style={styles.input}
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              required
              placeholder="Ej: Centro, Tucumán"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>
              Categoría{' '}
              <span style={styles.labelHint}>
                (dejar vacío para clasificación automática con IA)
              </span>
            </label>
            <select
              style={styles.input}
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
            >
              <option value="">🤖 Clasificar con IA automáticamente</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={styles.fila}>
            <div style={styles.campo}>
              <label style={styles.label}>Teléfono</label>
              <input
                style={styles.input}
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 381-123-4567"
              />
            </div>
            <div style={styles.campo}>
              <label style={styles.label}>Horario</label>
              <input
                style={styles.input}
                name="horario"
                value={formData.horario}
                onChange={handleChange}
                placeholder="Ej: Lun-Vie 20:00-04:00"
              />
            </div>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Fuente</label>
            <input
              style={styles.input}
              name="fuente"
              value={formData.fuente}
              onChange={handleChange}
              placeholder="Ej: google_maps, instagram"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Notas</label>
            <textarea
              style={{ ...styles.input, resize: 'vertical', minHeight: '70px' }}
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div style={styles.acciones}>
            <button
              type="button"
              style={styles.btnCancelar}
              onClick={onCerrar}
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={styles.btnGuardar}
              disabled={isPending}
            >
              {isPending
                ? modoEdicion ? 'Guardando...' : 'Creando...'
                : modoEdicion ? 'Guardar cambios' : 'Crear bar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#1e1e2e',
    border: '1px solid #2a2a3e',
    borderRadius: '16px',
    padding: '28px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  titulo: {
    margin: 0,
    color: '#f1f5f9',
    fontSize: '20px',
  },
  btnCerrar: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '20px',
    cursor: 'pointer',
  },
  avisoBox: {
    background: '#451a03',
    border: '1px solid #92400e',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  avisoTexto: {
    margin: '0 0 8px',
    color: '#fef3c7',
    fontSize: '14px',
  },
  btnContinuar: {
    background: '#d97706',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fila: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '600',
  },
  labelHint: {
    color: '#4b5563',
    fontWeight: '400',
    fontSize: '12px',
  },
  input: {
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  acciones: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  btnCancelar: {
    padding: '10px 20px',
    background: '#1f2937',
    color: '#94a3b8',
    border: '1px solid #374151',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  btnGuardar: {
    padding: '10px 24px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default BarForm;
