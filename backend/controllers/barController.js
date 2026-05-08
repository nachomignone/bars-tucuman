import Bar from '../models/Bar.js';
import { clasificarBar, detectarMejorDuplicado } from '../utils/aiService.js';

// ─── Normalización para pre-filtro MongoDB ────────────────────────────────────
const STOP_WORDS = new Set(['bar', 'boliche', 'pub', 'cafe', 'cafeteria', 'el', 'la', 'los', 'las', 'de', 'del', 'y', 'e']);

const normalizarTexto = (texto) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s]/g, '')     // quitar caracteres especiales
    .split(/\s+/)
    .filter((palabra) => palabra.length > 1 && !STOP_WORDS.has(palabra));
};

/**
 * OBTENER TODOS LOS BARES
 */
export const obtenerBares = async (req, res) => {
  try {
    const { activo, categoria, busqueda } = req.query;

    // Construir filtro dinámico
    let filtro = {};
    if (activo !== undefined) {
      filtro.activo = activo === 'true';
    }
    if (categoria) {
      filtro.categoria = categoria;
    }
    if (busqueda) {
      filtro.$text = { $search: busqueda };
    }

    const bares = await Bar.find(filtro).sort({ createdAt: -1 });

    res.json({
      success: true,
      cantidad: bares.length,
      data: bares,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error obteniendo bares',
      error: error.message,
    });
  }
};

/**
 * OBTENER UN BAR POR ID
 */
export const obtenerBarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const bar = await Bar.findById(id).populate('posibleDuplicadoDe');

    if (!bar) {
      return res.status(404).json({
        success: false,
        mensaje: 'Bar no encontrado',
      });
    }

    res.json({
      success: true,
      data: bar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error obteniendo bar',
      error: error.message,
    });
  }
};

/**
 * CREAR UN NUEVO BAR
 * Con clasificación automática por IA
 */
export const crearBar = async (req, res) => {
  try {
    const { nombre, ubicacion, categoria, telefono, horario, fuente, notas } = req.body;

    // Validaciones básicas
    if (!nombre || !ubicacion) {
      return res.status(400).json({
        success: false,
        mensaje: 'Nombre y ubicación son requeridos',
      });
    }

    // Clasificar automáticamente con IA si no especifica categoría
    let categoriaFinal = categoria || 'Otro';
    let clasificadoPorIA = false;

    if (!categoria) {
      console.log(`🤖 Clasificando "${nombre}" con Groq...`);
      categoriaFinal = await clasificarBar(nombre, ubicacion, horario, telefono);
      clasificadoPorIA = true;
    }

    // ── Capa 1: Pre-filtro MongoDB con normalización ──────────────────────────
    const palabrasSignificativas = normalizarTexto(nombre);
    let posiblesDuplicados = [];

    if (palabrasSignificativas.length === 0) {
      // Edge case: nombre compuesto solo de stop words (ej: "El Bar", "La Disco")
      // Fallback: búsqueda exacta por nombre completo para no matchear todo
      console.log(`⚠️  Nombre "${nombre}" solo contiene stop words — usando búsqueda exacta`);
      posiblesDuplicados = await Bar.find({
        nombre: { $regex: `^${nombre.trim()}$`, $options: 'i' },
        activo: true,
      }).select('_id nombre ubicacion telefono').limit(10);
    } else {
      // Limitar a 10 candidatos para no superar el límite de tokens de Groq
      const regexPattern = palabrasSignificativas.join('|');
      posiblesDuplicados = await Bar.find({
        nombre: { $regex: regexPattern, $options: 'i' },
        activo: true,
      }).select('_id nombre ubicacion telefono').limit(10);
    }

    // ── Capa 2: Batch prompting — una sola llamada a Groq ─────────────────────
    let posibleDuplicadoDe = null;
    let confianzaDeduplicacion = 0;

    // Edge case: sin candidatos → saltar Groq directamente
    if (posiblesDuplicados.length > 0) {
      console.log(`🔍 Pre-filtro encontró ${posiblesDuplicados.length} candidato(s). Enviando batch a Groq...`);

      const resultado = await detectarMejorDuplicado(
        { nombre, ubicacion, telefono: telefono || '' },
        posiblesDuplicados
      );

      if (resultado.duplicadoId && resultado.duplicadoId !== 'null' && resultado.confianza > 70) {
        posibleDuplicadoDe = resultado.duplicadoId;
        confianzaDeduplicacion = resultado.confianza;
        console.log(`⚠️ Duplicado detectado (id: ${posibleDuplicadoDe}, confianza: ${confianzaDeduplicacion}%)`);
      }
    }

    // Crear el bar
    const nuevoBar = new Bar({
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
      categoria: categoriaFinal,
      telefono: telefono?.trim() || '',
      horario: horario?.trim() || '',
      fuente: fuente || 'investigación_manual',
      clasificadoPorIA,
      confianzaDeduplicacion,
      posibleDuplicadoDe,
      notas: notas?.trim() || '',
    });

    await nuevoBar.save();

    res.status(201).json({
      success: true,
      mensaje: 'Bar creado exitosamente',
      data: nuevoBar,
      avisos: posibleDuplicadoDe
        ? [`⚠️ Posible duplicado detectado (confianza: ${confianzaDeduplicacion}%)`]
        : [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error creando bar',
      error: error.message,
    });
  }
};

/**
 * ACTUALIZAR UN BAR
 */
export const actualizarBar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizaciones = req.body;

    // Validaciones
    if (actualizaciones.nombre === '' || actualizaciones.ubicacion === '') {
      return res.status(400).json({
        success: false,
        mensaje: 'Nombre y ubicación no pueden estar vacíos',
      });
    }

    const bar = await Bar.findByIdAndUpdate(id, actualizaciones, {
      new: true,
      runValidators: true,
    });

    if (!bar) {
      return res.status(404).json({
        success: false,
        mensaje: 'Bar no encontrado',
      });
    }

    res.json({
      success: true,
      mensaje: 'Bar actualizado exitosamente',
      data: bar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error actualizando bar',
      error: error.message,
    });
  }
};

/**
 * DESACTIVAR UN BAR (soft delete)
 */
export const desactivarBar = async (req, res) => {
  try {
    const { id } = req.params;

    const bar = await Bar.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!bar) {
      return res.status(404).json({
        success: false,
        mensaje: 'Bar no encontrado',
      });
    }

    res.json({
      success: true,
      mensaje: 'Bar desactivado exitosamente',
      data: bar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error desactivando bar',
      error: error.message,
    });
  }
};

/**
 * ELIMINAR UN BAR PERMANENTEMENTE
 */
export const eliminarBar = async (req, res) => {
  try {
    const { id } = req.params;

    const bar = await Bar.findByIdAndDelete(id);

    if (!bar) {
      return res.status(404).json({
        success: false,
        mensaje: 'Bar no encontrado',
      });
    }

    res.json({
      success: true,
      mensaje: 'Bar eliminado permanentemente',
      data: bar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error eliminando bar',
      error: error.message,
    });
  }
};

/**
 * ESTADÍSTICAS
 */
export const obtenerEstadisticas = async (req, res) => {
  try {
    const total = await Bar.countDocuments();
    const activos = await Bar.countDocuments({ activo: true });
    const porCategoria = await Bar.aggregate([
      { $group: { _id: '$categoria', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
    ]);
    const clasificadosPorIA = await Bar.countDocuments({ clasificadoPorIA: true });
    const posiblesDuplicados = await Bar.countDocuments({ posibleDuplicadoDe: { $ne: null } });

    res.json({
      success: true,
      estadisticas: {
        totalBares: total,
        baresActivos: activos,
        baresInactivos: total - activos,
        clasificadosPorIA,
        posiblesDuplicados,
        distribucionPorCategoria: porCategoria,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error obteniendo estadísticas',
      error: error.message,
    });
  }
};

export default {
  obtenerBares,
  obtenerBarPorId,
  crearBar,
  actualizarBar,
  desactivarBar,
  eliminarBar,
  obtenerEstadisticas,
};
