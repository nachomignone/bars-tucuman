import { useState } from 'react';
import BarList from '../components/BarList';
import BarForm from '../components/BarForm';
import Estadisticas from '../components/Estadisticas';

const TABS = ['bares', 'estadisticas'];

const Dashboard = () => {
  // Estado de UI — no estado del servidor (eso lo maneja React Query)
  const [tabActiva, setTabActiva] = useState('bares');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [barAEditar, setBarAEditar] = useState(null);

  const abrirFormNuevo = () => {
    setBarAEditar(null);
    setMostrarForm(true);
  };

  const abrirFormEditar = (bar) => {
    setBarAEditar(bar);
    setMostrarForm(true);
  };

  const cerrarForm = () => {
    setMostrarForm(false);
    setBarAEditar(null);
  };

  return (
    <div style={styles.layout}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.titulo}>🍺 Bares Tucumán</h1>
          <p style={styles.subtitulo}>Sistema de gestión con clasificación IA</p>
        </div>
        <button style={styles.btnNuevo} onClick={abrirFormNuevo}>
          + Nuevo bar
        </button>
      </header>

      {/* Tabs */}
      <nav style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(tabActiva === tab ? styles.tabActiva : {}),
            }}
            onClick={() => setTabActiva(tab)}
          >
            {tab === 'bares' ? '📋 Bares' : '📊 Estadísticas'}
          </button>
        ))}
      </nav>

      {/* Contenido */}
      <main style={styles.main}>
        {tabActiva === 'bares' && (
          <BarList onEditar={abrirFormEditar} />
        )}
        {tabActiva === 'estadisticas' && (
          <Estadisticas />
        )}
      </main>

      {/* Modal de formulario */}
      {mostrarForm && (
        <BarForm
          barAEditar={barAEditar}
          onCerrar={cerrarForm}
        />
      )}
    </div>
  );
};

const styles = {
  layout: {
    minHeight: '100vh',
    background: '#0f0f1a',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    borderBottom: '1px solid #1e1e2e',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titulo: {
    margin: 0,
    color: '#f1f5f9',
    fontSize: '26px',
    fontWeight: '800',
  },
  subtitulo: {
    margin: 0,
    color: '#4b5563',
    fontSize: '13px',
  },
  btnNuevo: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    padding: '16px 32px 0',
    borderBottom: '1px solid #1e1e2e',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#64748b',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '-1px',
    transition: 'color 0.2s',
  },
  tabActiva: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
  },
  main: {
    flex: 1,
    padding: '28px 32px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
};

export default Dashboard;
