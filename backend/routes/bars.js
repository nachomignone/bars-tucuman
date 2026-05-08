import express from 'express';
import {
  obtenerBares,
  obtenerBarPorId,
  crearBar,
  actualizarBar,
  desactivarBar,
  eliminarBar,
  obtenerEstadisticas,
} from '../controllers/barController.js';

const router = express.Router();

/**
 * RUTAS CRUD
 */

// GET - Obtener todos los bares (con filtros opcionales)
// Ejemplo: GET /api/bares?activo=true&categoria=Bar&busqueda=irlanda
router.get('/', obtenerBares);

// GET - Obtener estadísticas
router.get('/estadisticas/resumen', obtenerEstadisticas);

// GET - Obtener un bar por ID
router.get('/:id', obtenerBarPorId);

// POST - Crear un nuevo bar
router.post('/', crearBar);

// PUT - Actualizar un bar
router.put('/:id', actualizarBar);

// DELETE - Desactivar un bar (soft delete)
router.patch('/:id/desactivar', desactivarBar);

// DELETE - Eliminar permanentemente
router.delete('/:id', eliminarBar);

export default router;
