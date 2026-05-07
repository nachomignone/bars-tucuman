import { useState } from 'react';
import { useGetBares, useDesactivarBar, useDeleteBar } from '../hooks/useBares';
import BarCard from './BarCard';

const CATEGORIAS = ['Bar', 'Boliche', 'Café', 'Recital', 'Otro'];

const BarList = ({ onEditar }) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);

  // Armar filtros para pasar a la query
  const filtros = {
    ...(soloActivos && { activo: true }),
    ...(categoria && { categoria }),
    ...(busqueda && { busqueda }),
  };

  const { data, isLoading, isError, error } = useGetBares(filtros);
  const desactivar = useDesactivarBar();
  const eliminar = useDeleteBar();

  const handleDesactivar = (id) => {
    if (confirm('¿Desactivar este bar?')) desactivar.mutate(id);
  };

  const handleEliminar = (id) => {
    if (confirm('¿Eliminar permanentemente este bar? Esta acción no se puede deshacer.'))
      eliminar.mutate(id);
  };

  return (
    <div style={styles.container}>
      {/* Filtros */}
      <div style={styles.filtros}>
        <input
          style={styles.buscador}
          placeholder="🔍 Buscar por nombre o ubicación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          style={styles.select}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
          />
          <span>Solo activos</span>
        </label>
      </div>

      {/* Estados de carga / error */}
      {isLoading && <p style={styles.mensaje}>Cargando bares...</p>}
      {isError && (
        <p style={styles.error}>
          Error al cargar los bares: {error?.message || 'Error desconocido'}
        </p>
      )}

      {/* Resultado */}
      {!isLoading && !isError && (
        <>
          <p style={styles.cantidad}>
            {data?.cantidad ?? 0} bar{data?.cantidad !== 1 ? 'es' : ''} encontrado{data?.cantidad !== 1 ? 's' : ''}
          </p>
          {data?.cantidad === 0 ? (
            <p style={styles.vacio}>No hay bares que coincidan con los filtros.</p>
          ) : (
            <div style={styles.grid}>
              {data?.data?.map((bar) => (
                <BarCard
                  key={bar._id}
                  bar={bar}
                  onEditar={onEditar}
                  onDesactivar={handleDesactivar}
                  onEliminar={handleEliminar}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  filtros: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  buscador: {
    flex: '1 1 240px',
    background: '#1e1e2e',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    minWidth: '200px',
  },
  select: {
    background: '#1e1e2e',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
  },
  mensaje: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: '40px 0',
  },
  error: {
    color: '#f87171',
    textAlign: 'center',
    padding: '20px 0',
  },
  cantidad: {
    color: '#64748b',
    fontSize: '13px',
    margin: 0,
  },
  vacio: {
    color: '#4b5563',
    textAlign: 'center',
    padding: '40px 0',
    fontSize: '15px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
};

export default BarList;
