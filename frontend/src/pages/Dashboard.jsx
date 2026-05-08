import { useState } from 'react';
import BarList from '../components/BarList';
import BarForm from '../components/BarForm';
import Estadisticas from '../components/Estadisticas';

const TABS = ['bares', 'estadisticas'];

export default function Dashboard() {
  const [tab, setTab] = useState('bares');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [barEditar, setBarEditar] = useState(null);

  const abrirCrear = () => {
    setBarEditar(null);
    setModalAbierto(true);
  };

  const abrirEditar = (bar) => {
    setBarEditar(bar);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setBarEditar(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🍺 Zoco</h1>
            <p className="text-xs text-gray-500">Gestión de Bares · Tucumán</p>
          </div>
          <button
            onClick={abrirCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Nuevo Bar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-1">
            <TabButton active={tab === 'bares'} onClick={() => setTab('bares')}>
              🍺 Bares
            </TabButton>
            <TabButton active={tab === 'estadisticas'} onClick={() => setTab('estadisticas')}>
              📊 Estadísticas
            </TabButton>
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'bares' && <BarList onEdit={abrirEditar} />}
        {tab === 'estadisticas' && <Estadisticas />}
      </main>

      {/* Modal */}
      {modalAbierto && (
        <BarForm barEditar={barEditar} onClose={cerrarModal} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
