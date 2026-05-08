import { useState } from 'react';
import { useGetBares, useDesactivarBar, useDeleteBar } from '../hooks/useBares';
import BarCard from './BarCard';

const CATEGORIAS = ['', 'Bar', 'Boliche', 'Café', 'Recital', 'Otro'];

export default function BarList({ onEdit }) {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);

  const filtros = {
    ...(categoria && { categoria }),
    ...(soloActivos !== null && { activo: soloActivos }),
  };

  const { data, isLoading, isError, error } = useGetBares(filtros);
  const desactivar = useDesactivarBar();
  const eliminar = useDeleteBar();

  const bares = data?.data || [];

  // Filtro de búsqueda en cliente (texto libre)
  const baresFiltrados = busqueda.trim()
    ? bares.filter(
        (b) =>
          b.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          b.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
      )
    : bares;

  const handleDesactivar = (id) => {
    if (confirm('¿Desactivar este bar? Podrás eliminarlo después.')) {
      desactivar.mutate(id);
    }
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar permanentemente este bar? Esta acción no se puede deshacer.')) {
      eliminar.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c === '' ? 'Todas las categorías' : c}
            </option>
          ))}
        </select>
        <select
          value={soloActivos === null ? '' : soloActivos.toString()}
          onChange={(e) =>
            setSoloActivos(e.target.value === '' ? null : e.target.value === 'true')
          }
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
          <option value="">Todos</option>
        </select>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">⏳</div>
          <p>Cargando bares...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          ❌ Error al cargar bares: {error?.message || 'Error desconocido'}
        </div>
      )}

      {/* Conteo */}
      {!isLoading && !isError && (
        <p className="text-sm text-gray-500">
          {baresFiltrados.length} bar{baresFiltrados.length !== 1 ? 'es' : ''} encontrado
          {baresFiltrados.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid de cards */}
      {!isLoading && !isError && baresFiltrados.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🍺</div>
          <p>No hay bares con los filtros seleccionados.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {baresFiltrados.map((bar) => (
          <BarCard
            key={bar._id}
            bar={bar}
            onEdit={onEdit}
            onDesactivar={handleDesactivar}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
