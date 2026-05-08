const CATEGORIA_COLORS = {
  Bar: 'bg-amber-100 text-amber-800',
  Boliche: 'bg-purple-100 text-purple-800',
  Café: 'bg-green-100 text-green-800',
  Recital: 'bg-red-100 text-red-800',
  Otro: 'bg-gray-100 text-gray-700',
};

export default function BarCard({ bar, onEdit, onDesactivar, onDelete }) {
  const colorClass = CATEGORIA_COLORS[bar.categoria] || CATEGORIA_COLORS.Otro;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">{bar.nombre}</h3>
          <p className="text-gray-500 text-sm mt-0.5">{bar.ubicacion}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${colorClass}`}>
          {bar.categoria}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 text-sm text-gray-600">
        {bar.telefono && (
          <span>📞 {bar.telefono}</span>
        )}
        {bar.horario && (
          <span>🕐 {bar.horario}</span>
        )}
        {bar.fuente && (
          <span className="text-xs text-gray-400">Fuente: {bar.fuente}</span>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {bar.clasificadoPorIA && (
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
            🤖 Clasificado por IA
          </span>
        )}
        {bar.posibleDuplicadoDe && (
          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
            ⚠️ Posible duplicado ({bar.confianzaDeduplicacion}%)
          </span>
        )}
        {!bar.activo && (
          <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
            Inactivo
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onEdit(bar)}
          className="flex-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg py-1.5 transition-colors"
        >
          ✏️ Editar
        </button>
        {bar.activo ? (
          <button
            onClick={() => onDesactivar(bar._id)}
            className="flex-1 text-sm text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg py-1.5 transition-colors"
          >
            🔕 Desactivar
          </button>
        ) : (
          <button
            onClick={() => onDelete(bar._id)}
            className="flex-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg py-1.5 transition-colors"
          >
            🗑️ Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
