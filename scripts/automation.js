/**
 * SCRIPT DE AUTOMATIZACIÓN - Sistema de Gestión de Bares Tucumán
 *
 * Worker standalone (NO depende del servidor Express).
 * Se conecta directamente a MongoDB y reutiliza geminiService del backend.
 *
 * Flujo por ciclo:
 *   1. Simular scraping → obtener bares "nuevos"
 *   2. Clasificar con Gemini
 *   3. Detectar duplicados con Gemini
 *   4. Persistir en MongoDB si pasa el filtro
 *   5. Imprimir resumen del ciclo
 */

import cron from 'node-cron';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Cargar .env del backend
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../backend/.env') });

// ─── Importar modelo y servicio de IA del backend ──────────────────────────
import Bar from '../backend/models/Bar.js';
import { clasificarBar, detectarDuplicado } from '../backend/utils/geminiService.js';

// ─── Configuración ──────────────────────────────────────────────────────────
const CONFIANZA_DUPLICADO_MINIMA = 70; // % mínimo para rechazar un bar como duplicado
const INTERVALO_CRON = '* * * * *';    // Cada 1 minuto (cambiar a '0 */6 * * *' para producción)
const LOG_DIR = join(__dirname, 'logs');

// ─── Utilidades de logging ──────────────────────────────────────────────────

const timestamp = () => new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Tucuman' });

const log = {
  separador: () => console.log('═'.repeat(55)),
  linea:     () => console.log('─'.repeat(55)),
  info:      (msg) => console.log(`  ${msg}`),
  ok:        (msg) => console.log(`  ✅ ${msg}`),
  warn:      (msg) => console.log(`  ⚠️  ${msg}`),
  error:     (msg) => console.log(`  ❌ ${msg}`),
};

const guardarLogEnArchivo = (contenido) => {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const fecha = new Date().toISOString().split('T')[0];
    const archivo = join(LOG_DIR, `automation-${fecha}.log`);
    fs.appendFileSync(archivo, contenido + '\n');
  } catch {
    // El log en archivo es best-effort, no interrumpe el flujo
  }
};

// ─── Ingesta simulada (mock scraping) ───────────────────────────────────────

/**
 * Simula la obtención de bares desde una fuente externa.
 * En producción, esto sería una llamada a una API pública o un scraper real.
 *
 * Incluye intencionalmente un duplicado de "Bar Irlanda" para probar la IA.
 */
const simularScraping = () => [
  {
    nombre: 'Mercado del Este',
    ubicacion: 'Av. Mate de Luna 300, San Miguel de Tucumán',
    telefono: '+54 381 490-1122',
    horario: '12:00 - 00:00',
    fuente: 'scraping_simulado',
  },
  {
    // Duplicado intencional — nombre levemente distinto pero mismo lugar que "Bar Irlanda"
    nombre: 'Irlanda Tucumán Bar',
    ubicacion: 'San Juan 123, San Miguel de Tucumán',
    telefono: '+54 381 423-1234',
    fuente: 'scraping_simulado',
  },
  {
    nombre: 'Jazz & Vinos',
    ubicacion: 'Muñecas 850, San Miguel de Tucumán',
    horario: '20:00 - 02:00',
    fuente: 'scraping_simulado',
  },
];

// ─── Procesamiento de un bar ─────────────────────────────────────────────────

const procesarBar = async (bar, indice, total) => {
  console.log('');
  log.info(`[${indice}/${total}] Procesando: "${bar.nombre}"`);

  // 1. Clasificar categoría con Gemini
  const categoria = await clasificarBar(bar.nombre, bar.ubicacion);
  log.info(`→ Categoría IA: ${categoria} ✅`);

  // 2. Buscar candidatos a duplicado en la BD (búsqueda por texto)
  const candidatos = await Bar.find({
    $text: { $search: bar.nombre },
    activo: true,
  }).limit(3);

  // 3. Confirmar duplicado con Gemini si hay candidatos
  if (candidatos.length > 0) {
    for (const candidato of candidatos) {
      const resultado = await detectarDuplicado(
        { nombre: bar.nombre, ubicacion: bar.ubicacion },
        { nombre: candidato.nombre, ubicacion: candidato.ubicacion }
      );

      if (resultado.esDuplicado && resultado.confianza >= CONFIANZA_DUPLICADO_MINIMA) {
        log.warn(`Posible duplicado de "${candidato.nombre}" (confianza: ${resultado.confianza}%)`);
        log.error(`RECHAZADO por duplicado`);
        return { insertado: false, motivo: 'duplicado', confianza: resultado.confianza };
      }
    }
  } else {
    log.info('→ Sin duplicados detectados');
  }

  // 4. Persistir en MongoDB
  const nuevoBar = new Bar({
    nombre: bar.nombre.trim(),
    ubicacion: bar.ubicacion.trim(),
    categoria,
    telefono: bar.telefono?.trim() || '',
    horario: bar.horario?.trim() || '',
    fuente: bar.fuente || 'scraping_simulado',
    clasificadoPorIA: true,
    activo: true,
  });

  await nuevoBar.save();
  log.ok('GUARDADO');
  return { insertado: true };
};

// ─── Ciclo principal ─────────────────────────────────────────────────────────

const ejecutarCiclo = async () => {
  const inicio = Date.now();
  const ahora = timestamp();

  log.separador();
  console.log(`🤖 CICLO DE AUTOMATIZACIÓN - ${ahora}`);
  log.separador();

  const bares = simularScraping();
  log.info(`📥 Bares obtenidos del scraping simulado: ${bares.length}`);
  log.linea();

  let insertados = 0;
  let rechazados = 0;
  const errores = [];

  for (let i = 0; i < bares.length; i++) {
    try {
      const resultado = await procesarBar(bares[i], i + 1, bares.length);
      if (resultado.insertado) insertados++;
      else rechazados++;
    } catch (error) {
      log.error(`Error procesando "${bares[i].nombre}": ${error.message}`);
      errores.push(bares[i].nombre);
    }
  }

  const duracion = ((Date.now() - inicio) / 1000).toFixed(1);

  log.linea();
  console.log(`📊 RESUMEN: ${bares.length} procesados | ${insertados} insertados | ${rechazados} rechazados${errores.length ? ` | ${errores.length} errores` : ''}`);
  console.log(`⏱️  Duración del ciclo: ${duracion}s`);
  console.log(`⏭️  Próximo ciclo en 1 minuto`);
  log.separador();

  // Guardar resumen en archivo de log
  const resumen = `[${ahora}] Procesados: ${bares.length} | Insertados: ${insertados} | Rechazados: ${rechazados} | Duración: ${duracion}s`;
  guardarLogEnArchivo(resumen);
};

// ─── Conexión a MongoDB e inicio del cron ────────────────────────────────────

const iniciar = async () => {
  console.log('');
  log.separador();
  console.log('🚀 AUTOMATIZACIÓN DE BARES TUCUMÁN');
  log.separador();

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.ok('Conectado a MongoDB Atlas');
  } catch (error) {
    log.error(`No se pudo conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }

  log.info(`Intervalo configurado: cada 1 minuto (testing)`);
  log.info(`Umbral de duplicados: ${CONFIANZA_DUPLICADO_MINIMA}% de confianza`);
  log.separador();
  console.log('');

  // Ejecutar inmediatamente al arrancar, luego en el intervalo configurado
  await ejecutarCiclo();

  cron.schedule(INTERVALO_CRON, async () => {
    await ejecutarCiclo();
  });
};

iniciar();
