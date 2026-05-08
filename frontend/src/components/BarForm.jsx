import { useState, useEffect } from 'react';
import { useCreateBar, useUpdateBar } from '../hooks/useBares';

const CATEGORIAS = ['Bar', 'Boliche', 'Café', 'Recital', 'Otro'];

const EMPTY_FORM = {
  nombre: '',
  ubicacion: '',
  categoria: '',
  telefono: '',
  horario: '',
  fuente: 'investigación_manual',
  notas: '',
};

export default function BarForm({ barEditar, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const createBar = useCreateBar();
  const updateBar = useUpdateBar();
  const isPending = createBar.isPending || updateBar.isPending;

  useEffect(() => {
    if (barEditar) {
      setForm({
        nombre: barEditar.nombre || '',
        ubicacion: barEditar.ubicacion || '',
        categoria: barEditar.categoria || '',
        telefono: barEditar.telefono || '',
        horario: barEditar.horario || '',
        fuente: barEditar.fuente || 'investigación_manual',
        notas: barEditar.notas || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [barEditar]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim() || !form.ubicacion.trim()) {
      setError('Nombre y ubicación son obligatorios.');
      return;
    }

    try {
      if (barEditar) {
        await updateBar.mutateAsync({ id: barEditar._id, ...form });
      } else {
        await createBar.mutateAsync(form);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.mensaje || 'Error al guardar. Intentá de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {barEditar ? '✏️ Editar Bar' : '➕ Nuevo Bar'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Bar Irlanda"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Ubicación <span className="text-red-500">*</span>
            </label>
            <input
              name="ubicacion"
              value={form.ubicacion}
              onChange={handleChange}
              placeholder="Ej: San Martín 765, Tucumán"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Categoría{' '}
              <span className="text-gray-400 font-normal text-xs">(opcional — la IA clasifica si no elegís)</span>
            </label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Dejar que la IA clasifique —</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+54 381 555-0000"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Horario</label>
              <input
                name="horario"
                value={form.horario}
                onChange={handleChange}
                placeholder="Vie y Sáb 21:00 - 05:00"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Fuente</label>
            <select
              name="fuente"
              value={form.fuente}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="investigación_manual">Investigación manual</option>
              <option value="scraping_automatico">Scraping automático</option>
              <option value="usuario">Usuario</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notas</label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Notas adicionales..."
              rows={2}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Guardando...' : barEditar ? 'Guardar cambios' : 'Crear bar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
