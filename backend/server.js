import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import barsRoutes from './routes/bars.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// MIDDLEWARE
// =====================

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =====================
// CONEXIÓN A BD
// =====================

const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Base de datos conectada\n');

    // =====================
    // RUTAS
    // =====================

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date(),
        message: '✅ Servidor funcionando correctamente',
      });
    });

    // Rutas de bares
    app.use('/api/bares', barsRoutes);

    // Ruta raíz
    app.get('/', (req, res) => {
      res.json({
        proyecto: 'Sistema de Gestión de Bares y Eventos de Tucumán',
        version: '1.0.0',
        endpoints: {
          health: 'GET /api/health',
          bares: {
            obtenerTodos: 'GET /api/bares',
            obtenerUno: 'GET /api/bares/:id',
            crear: 'POST /api/bares',
            actualizar: 'PUT /api/bares/:id',
            desactivar: 'PATCH /api/bares/:id/desactivar',
            eliminar: 'DELETE /api/bares/:id',
            estadisticas: 'GET /api/bares/estadisticas/resumen',
          },
        },
      });
    });

    // Manejo de rutas no encontradas
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        mensaje: 'Ruta no encontrada',
        ruta: req.originalUrl,
      });
    });

    // Manejo de errores global
    app.use((err, req, res, next) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({
        success: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error desconocido',
      });
    });

    // =====================
    // INICIAR SERVIDOR
    // =====================

    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════');
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log('═══════════════════════════════════════');
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}/api/bares`);
      console.log(`📍 Health: http://localhost:${PORT}/api/health`);
      console.log('═══════════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();
