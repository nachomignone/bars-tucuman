import { useGetEstadisticas } from '../hooks/useBares';

const CATEGORIA_COLORES = {
  Bar: '#3b82f6',
  Boliche: '#8b5cf6',
  Café: '#f59e0b',
  Recital: '#ef4444',
  Otro: '#6b7280',
};

const Estadisticas = () => {
  const { data, isLoading, isError } = useGetEstadisticas();

  if (isLoading) return <p style={styles.mensaje}>Cargando estadísticas...</p>;
  if (isError) return <p style={styles.error}>Error cargando estadísticas.</p>;

  const stats = data?.estadisticas;
  if (!stats) return null;

  return (
    <div style={styles.container}>
      {/* Tarjetas de resumen */}
      <div style={styles.grid}>
        <StatCard label="Total de bares" valor={stats.totalBares} color="#3b82f6" />
        <StatCard label="Activos" valor={stats.baresActivos} color="#22c55e" />
        <StatCard label="Inactivos" valor={stats.baresInactivos} color="#6b7280" />
        <StatCard label="Clasificados por IA" valor={stats.clasificadosPorIA} color="#8b5cf6" emoji="🤖" />
        <StatCard label="Posibles duplicados" valor={stats.posiblesDuplicados} color="#f59e0b" emoji="⚠️" />
      </div>

      {/* Distribución por categoría */}
      {stats.distribucionPorCategoria?.length > 0 && (
        <div style={styles.distribucion}>
          <h3 style={styles.subtitulo}>Distribución por categoría</h3>
          <div style={styles.barras}>
            {stats.distribucionPorCategoria.map((item) => {
              const pct = Math.round((item.cantidad / stats.totalBares) * 100);
              const color = CATEGORIA_COLORES[item._id] || '#6b7280';
              return (
                <div key={item._id} style={styles.barraItem}>
                  <div style={styles.barraLabel}>
                    <span style={styles.barraCategoria}>{item._id}</span>
                    <span style={styles.barraCantidad}>{item.cantidad}</span>
                  </div>
                  <div style={styles.barraTrack}>
                    <div
                      style={{
                        ...styles.barraFill,
                        width: `${pct}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <span style={styles.barraPct}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, valor, color, emoji }) => (
  <div style={{ ...styles.card, borderColor: color }}>
    <span style={{ ...styles.cardValor, color }}>
      {emoji && `${emoji} `}{valor}
    </span>
    <span style={styles.cardLabel}>{label}</span>
  </div>
);

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#1e1e2e',
    border: '1px solid',
    borderRadius: '12px',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  cardValor: {
    fontSize: '36px',
    fontWeight: '800',
    lineHeight: 1,
  },
  cardLabel: {
    color: '#94a3b8',
    fontSize: '13px',
    textAlign: 'center',
  },
  distribucion: {
    background: '#1e1e2e',
    border: '1px solid #2a2a3e',
    borderRadius: '12px',
    padding: '20px',
  },
  subtitulo: {
    color: '#f1f5f9',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 16px',
  },
  barras: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  barraItem: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 40px',
    alignItems: 'center',
    gap: '10px',
  },
  barraLabel: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  barraCategoria: {
    color: '#f1f5f9',
    fontSize: '13px',
  },
  barraCantidad: {
    color: '#64748b',
    fontSize: '12px',
  },
  barraTrack: {
    background: '#0f0f1a',
    borderRadius: '4px',
    height: '8px',
    overflow: 'hidden',
  },
  barraFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
  barraPct: {
    color: '#64748b',
    fontSize: '12px',
    textAlign: 'right',
  },
  mensaje: {
    color: '#94a3b8',
    padding: '20px 0',
  },
  error: {
    color: '#f87171',
    padding: '20px 0',
  },
};

export default Estadisticas;
