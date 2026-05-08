import { useGetEstadisticas } from '../hooks/useBares';

const CATEGORIA_COLORS = {
  Bar: 'bg-amber-400',
  Boliche: 'bg-purple-400',
  Café: 'bg-green-400',
  Recital: 'bg-red-400',
  Otro: 'bg-gray-400',
};

export default function Estadisticas() {
  const { data, isLoading, isError } = useGetEstadisticas();

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-2">📊</div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        ❌ Error al cargar estadísticas.
      </div>
    );
  }

  const stats = data?.estadisticas;
  if (!stats) return null;

  const maxCategoria = Math.max(
    ...stats.distribucionPorCategoria.map((c) => c.cantidad),
    1
  );

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total de bares" value={stats.totalBares} icon="🍺" />
        <StatCard label="Bares activos" value={stats.baresActivos} icon="✅" color="text-green-600" />
        <StatCard label="Clasificados por IA" value={stats.clasificadosPorIA} icon="🤖" color="text-blue-600" />
        <StatCard label="Posibles duplicados" value={stats.posiblesDuplicados} icon="⚠️" color="text-amber-600" />
      </div>

      {/* Distribución por categoría */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Distribución por categoría</h3>
        <div className="flex flex-col gap-3">
          {stats.distribucionPorCategoria.map((cat) => {
            const pct = Math.round((cat.cantidad / maxCategoria) * 100);
            const colorClass = CATEGORIA_COLORS[cat._id] || CATEGORIA_COLORS.Otro;
            return (
              <div key={cat._id} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-20 shrink-0">{cat._id}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-6 text-right">
                  {cat.cantidad}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-1">
      <span className="text-2xl">{icon}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}
