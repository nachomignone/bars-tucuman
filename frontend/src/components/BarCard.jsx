const CATEGORIA_COLORES = {
  Bar: '#3b82f6',
  Boliche: '#8b5cf6',
  Café: '#f59e0b',
  Recital: '#ef4444',
  Otro: '#6b7280',
};

const BarCard = ({ bar, onEditar, onDesactivar, onEliminar }) => {
  const color = CATEGORIA_COLORES[bar.categoria] || CATEGORIA_COLORES.Otro;

  return (
    <div style={styles.card}>
      {/* Header con categoría y estado */}
      <div style={styles.header}>
        <span style={{ ...styles.badge, backgroundColor: color }}>
          {bar.categoria}
        </span>
        <div style={styles.badges}>
          {bar.clasificadoPorIA && (
            <span style={styles.badgeIA}>🤖 IA</span>
          )}
          {bar.posibleDuplicadoDe && (
            <span style={styles.badgeDuplicado}>⚠️ Posible duplicado</span>
          )}
          {!bar.activo && (
            <span style={styles.badgeInactivo}>Inactivo</span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <h3 style={styles.nombre}>{bar.nombre}</h3>
      <p style={styles.ubicacion}>📍 {bar.ubicacion}</p>

      {bar.telefono && <p style={styles.detalle}>📞 {bar.telefono}</p>}
      {bar.horario && <p style={styles.detalle}>🕐 {bar.horario}</p>}
      {bar.fuente && (
        <p style={styles.fuente}>Fuente: {bar.fuente}</p>
      )}

      {/* Acciones */}
      <div style={styles.acciones}>
        <button style={styles.btnEditar} onClick={() => onEditar(bar)}>
          Editar
        </button>
        {bar.activo && (
          <button
            style={styles.btnDesactivar}
            onClick={() => onDesactivar(bar._id)}
          >
            Desactivar
          </button>
        )}
        <button style={styles.btnEliminar} onClick={() => onEliminar(bar._id)}>
          Eliminar
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: '#1e1e2e',
    border: '1px solid #2a2a3e',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
  },
  badges: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  badge: {
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  badgeIA: {
    background: '#1d4ed8',
    color: '#fff',
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '20px',
  },
  badgeDuplicado: {
    background: '#92400e',
    color: '#fef3c7',
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '20px',
  },
  badgeInactivo: {
    background: '#374151',
    color: '#9ca3af',
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '20px',
  },
  nombre: {
    margin: '4px 0 0',
    color: '#f1f5f9',
    fontSize: '18px',
    fontWeight: '700',
  },
  ubicacion: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '14px',
  },
  detalle: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '13px',
  },
  fuente: {
    margin: '4px 0 0',
    color: '#4b5563',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  acciones: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  btnEditar: {
    flex: 1,
    padding: '8px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },
  btnDesactivar: {
    flex: 1,
    padding: '8px',
    background: '#d97706',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },
  btnEliminar: {
    flex: 1,
    padding: '8px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },
};

export default BarCard;
