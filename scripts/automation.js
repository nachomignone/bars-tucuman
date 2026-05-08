/**
 * automation.js — Script de automatización de scraping y clasificación de bares
 * Tucumán, Argentina
 *
 * Ejecuta un ciclo de scraping simulado cada 6 horas (configurable).
 * Clasifica bares con IA (Groq / llama-3.3-70b-versatile).
 * Detecta duplicados con batch prompting — una sola llamada por ciclo.
 * Persiste resultados en MongoDB Atlas.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';

// ─── Paths ────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../backend/.env') });

// ─── Groq Client ──────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// ─── Schema de Bar (autónomo) ─────────────────────────────────────────────────
const barSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    ubicacion: { type: String, required: true, trim: true },
    categoria: {
      type: String,
      enum: ['Bar', 'Boliche', 'Café', 'Recital', 'Otro'],
      default: 'Otro',
    },
    telefono: { type: String, default: '' },
    horario: { type: String, default: '' },
    fuente: { type: String, default: 'scraping_automatico' },
    activo: { type: Boolean, default: true },
    clasificadoPorIA: { type: Boolean, default: false },
    posibleDuplicadoDe: { type: mongoose.Schema.Types.ObjectId, ref: 'Bar', default: null },
    confianzaDeduplicacion: { type: Number, default: 0 },
    notas: { type: String, default: '' },
  },
  { timestamps: true }
);

const Bar = mongoose.models.Bar || mongoose.model('Bar', barSchema);

// ─── Schema de CronLog ────────────────────────────────────────────────────────
const cronLogSchema = new mongoose.Schema(
  {
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    duracionMs: { type: Number, required: true },
    procesados: { type: Number, default: 0 },
    guardados: { type: Number, default: 0 },
    duplicados: { type: Number, default: 0 },
    errores: { type: Number, default: 0 },
    detalle: [
      {
        nombre: String,
        accion: { type: String, enum: ['guardado', 'duplicado', 'error'] },
        categoria: String,
        confianzaDuplicado: Number,
        motivo: String,
      },
    ],
  },
  { timestamps: false }
);

const CronLog = mongoose.models.CronLog || mongoose.model('CronLog', cronLogSchema);

// ─── Normalización para pre-filtro MongoDB ────────────────────────────────────
const STOP_WORDS = new Set(['bar', 'boliche', 'pub', 'cafe', 'cafeteria', 'el', 'la', 'los', 'las', 'de', 'del', 'y', 'e']);

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((p) => p.length > 1 && !STOP_WORDS.has(p));
}

// ─── Funciones de IA ──────────────────────────────────────────────────────────

async function clasificarBar(nombre, ubicacion, horario = '', telefono = '') {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Eres un clasificador experto de establecimientos de ocio y gastronomía en Tucumán, Argentina.

Analizá TODOS los datos disponibles y clasificá el establecimiento en UNA de estas categorías:

CATEGORÍAS Y CRITERIOS:
- Bar: pub, cervecería, bar de copas, whisquería, bar irlandés/celta. Horario típico: tarde-noche (18:00-03:00)
- Boliche: discoteca, club nocturno, dance club, after hour. Horario típico: madrugada (00:00-06:00)
- Café: cafetería, confitería, coffee shop, panadería con mesas. Horario típico: mañana-tarde (07:00-22:00)
- Recital: teatro, sala de shows, espacio cultural, venue de música en vivo, peña folklórica
- Otro: restaurante, casino, salón de eventos, hotel, spa, o cualquier otro que no encaje claramente

DATOS DEL ESTABLECIMIENTO:
- Nombre: "${nombre}"
- Ubicación: "${ubicacion}"
- Horario: "${horario || 'no disponible'}"
- Teléfono: "${telefono || 'no disponible'}"

INSTRUCCIONES DE ANÁLISIS (en orden de prioridad):
1. Palabras clave en el nombre: "bar", "pub", "irish", "cervecería" → Bar | "boliche", "disco", "club" → Boliche | "café", "coffee", "confitería" → Café | "teatro", "cultural", "peña" → Recital
2. Inferencia por horario: madrugada (00:00-06:00) → probable Boliche | matutino (07:00-14:00) → probable Café | nocturno extendido (20:00-03:00) → probable Bar
3. Inferencia por ubicación: shopping o centro comercial → probable Café | zona céntrica nocturna de Tucumán → probable Bar o Boliche
4. Referencias culturales: "Irlanda", "Irish", "Celtic" → Bar | "Jazz", "Blues", "Folk" → Bar o Recital

FALLBACK OBLIGATORIO: Si el nombre es abstracto (ej: "La Esquina", "El Galpón") Y no tenés horario ni ubicación suficiente para inferir con seguridad → respondé OBLIGATORIAMENTE "Otro".

Responde SOLO con la categoría exacta: Bar, Boliche, Café, Recital u Otro. Sin explicación.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    const text = completion.choices[0]?.message?.content?.trim() || 'Otro';
    const categoriasValidas = ['Bar', 'Boliche', 'Café', 'Recital', 'Otro'];
    return categoriasValidas.includes(text) ? text : 'Otro';
  } catch (error) {
    console.error('  ❌ Error clasificando:', error.message);
    return 'Otro';
  }
}

async function detectarMejorDuplicado(barNuevo, candidatos) {
  if (!candidatos.length) return { duplicadoId: null, confianza: 0, motivo: 'Sin candidatos' };

  try {
    const listaCandidatos = candidatos
      .map(
        (c, i) =>
          `Candidato ${i + 1} (id: "${c._id}"):
  - Nombre: "${c.nombre}"
  - Ubicación: "${c.ubicacion}"
  - Teléfono: "${c.telefono || 'no disponible'}"`
      )
      .join('\n\n');

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Eres un sistema experto en deduplicación de bares y locales nocturnos en Tucumán, Argentina.

Tenés un BAR NUEVO que se quiere registrar y una lista de CANDIDATOS ya existentes en la base de datos.
Tu tarea: identificar cuál candidato (si alguno) es el MISMO establecimiento que el bar nuevo.

BAR NUEVO:
- Nombre: "${barNuevo.nombre}"
- Ubicación: "${barNuevo.ubicacion}"
- Teléfono: "${barNuevo.telefono || 'no disponible'}"

CANDIDATOS:
${listaCandidatos}

REGLAS DE EVALUACIÓN:
A) Nombre muy similar + misma calle con número casi igual (ej: 1060 vs 1064) → Error de tipeo → DUPLICADO (confianza 85-95%)
B) Nombre muy similar + calles totalmente distintas → Posible franquicia/sucursal → NO duplicado (confianza 20-40%)
C) Si los teléfonos coinciden o son casi iguales → aumenta la probabilidad de ser el mismo establecimiento
D) Nombre reordenado (ej: "Bar Irlanda" vs "Irlanda Bar") + misma zona → DUPLICADO
E) Nombres parecidos pero distintos → usar ubicación y teléfono para decidir
F) Diferencias de tildes, mayúsculas o artículos no indican establecimientos distintos

Evaluá TODOS los candidatos y devolvé el que tenga MAYOR probabilidad de ser duplicado.
Si ninguno supera confianza 50%, devolvé null como duplicadoId.

IMPORTANTE: Responde ÚNICAMENTE con el JSON, nada más antes ni después:
{"duplicadoId": "<id del candidato o null>", "confianza": 90, "motivo": "mismo nombre e dirección casi idéntica"}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 120,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = responseText.match(/\{[^{}]*"duplicadoId"[^{}]*\}/);

    if (!jsonMatch) {
      console.error('  ⚠️  Respuesta IA no parseable:', responseText.slice(0, 120));
      return { duplicadoId: null, confianza: 0, motivo: 'No se pudo procesar' };
    }

    const respuesta = JSON.parse(jsonMatch[0]);
    if (typeof respuesta.confianza === 'string') {
      respuesta.confianza = parseInt(respuesta.confianza, 10) || 0;
    }

    return respuesta;
  } catch (error) {
    console.error('  ❌ Error detectando duplicado:', error.message);
    return { duplicadoId: null, confianza: 0, motivo: 'Error en procesamiento' };
  }
}

// ─── Datos simulados de scraping ──────────────────────────────────────────────

function obtenerBaresScraped() {
  return [
    {
      nombre: 'Antares Tucumán',
      ubicacion: 'Av. Mate de Luna 2800, Yerba Buena, Tucumán',
      telefono: '+54 381 555-0100',
      horario: 'Jue a Dom 20:00 - 03:00',
    },
    {
      nombre: 'Irlanda Tucumán Bar',
      ubicacion: 'San Martín 765, San Miguel de Tucumán',
      telefono: '+54 381 555-0201',
      horario: 'Vie y Sáb 21:00 - 05:00',
    },
    {
      nombre: 'El Federal Café',
      ubicacion: 'Congreso 19, San Miguel de Tucumán',
      telefono: '+54 381 555-0302',
      horario: 'Lun a Dom 08:00 - 23:00',
    },
  ];
}

// ─── Lógica principal del ciclo ───────────────────────────────────────────────

async function ejecutarCiclo() {
  const separator = '═'.repeat(55);
  const fechaInicio = new Date();
  console.log(`\n${separator}`);
  console.log(`  🤖 CICLO DE SCRAPING — ${fechaInicio.toLocaleString('es-AR')}`);
  console.log(`${separator}`);

  const scraped = obtenerBaresScraped();
  console.log(`  📋 Bares encontrados en scraping: ${scraped.length}`);

  let guardados = 0;
  let duplicadosOmitidos = 0;
  let errores = 0;
  const detalle = [];

  for (const barData of scraped) {
    console.log(`\n  ▶ Procesando: "${barData.nombre}"`);

    try {
      // 1. Clasificar con IA
      const categoria = await clasificarBar(
        barData.nombre,
        barData.ubicacion,
        barData.horario,
        barData.telefono
      );
      console.log(`     🏷  Categoría IA: ${categoria}`);

      // 2. Pre-filtro MongoDB con normalización de texto
      const palabrasSignificativas = normalizarTexto(barData.nombre);
      let candidatos = [];

      if (palabrasSignificativas.length === 0) {
        // Edge case: nombre compuesto solo de stop words → búsqueda exacta
        console.log(`     ⚠️  Nombre solo tiene stop words — usando búsqueda exacta`);
        candidatos = await Bar.find({
          nombre: { $regex: `^${barData.nombre.trim()}$`, $options: 'i' },
          activo: true,
        }).select('_id nombre ubicacion telefono').limit(10);
      } else {
        // Límite de 10 candidatos para no superar TPM de Groq
        const regexPattern = palabrasSignificativas.join('|');
        candidatos = await Bar.find({
          nombre: { $regex: regexPattern, $options: 'i' },
          activo: true,
        }).select('_id nombre ubicacion telefono').limit(10);
      }

      // 3. Batch prompting — una sola llamada a Groq para todos los candidatos
      let refDuplicado = null;
      let confianza = 0;
      let motivoDuplicado = '';

      if (candidatos.length > 0) {
        console.log(`     🔍 Pre-filtro: ${candidatos.length} candidato(s). Enviando batch a Groq...`);

        const resultado = await detectarMejorDuplicado(
          { nombre: barData.nombre, ubicacion: barData.ubicacion, telefono: barData.telefono || '' },
          candidatos
        );

        console.log(
          `     → ${resultado.duplicadoId && resultado.duplicadoId !== 'null'
            ? `⚠️ DUPLICADO (confianza: ${resultado.confianza}%) — ${resultado.motivo}`
            : `✅ Único (confianza duplicado: ${resultado.confianza}%)`}`
        );

        if (resultado.duplicadoId && resultado.duplicadoId !== 'null' && resultado.confianza > 70) {
          refDuplicado = resultado.duplicadoId;
          confianza = resultado.confianza;
          motivoDuplicado = resultado.motivo;
        }
      }

      if (refDuplicado) {
        console.log(`     ⏭  Omitido — duplicado con confianza ${confianza}%`);
        duplicadosOmitidos++;
        detalle.push({
          nombre: barData.nombre,
          accion: 'duplicado',
          categoria,
          confianzaDuplicado: confianza,
          motivo: motivoDuplicado,
        });
        continue;
      }

      // 4. Guardar en MongoDB
      const nuevoBar = new Bar({
        nombre: barData.nombre.trim(),
        ubicacion: barData.ubicacion.trim(),
        categoria,
        telefono: barData.telefono || '',
        horario: barData.horario || '',
        fuente: 'scraping_automatico',
        clasificadoPorIA: true,
        posibleDuplicadoDe: null,
        confianzaDeduplicacion: 0,
      });

      await nuevoBar.save();
      console.log(`     ✅ Guardado en MongoDB (id: ${nuevoBar._id})`);
      guardados++;
      detalle.push({
        nombre: barData.nombre,
        accion: 'guardado',
        categoria,
        confianzaDuplicado: 0,
        motivo: '',
      });

    } catch (err) {
      console.error(`     ❌ Error procesando "${barData.nombre}":`, err.message);
      errores++;
      detalle.push({
        nombre: barData.nombre,
        accion: 'error',
        motivo: err.message,
      });
    }
  }

  const fechaFin = new Date();
  const duracionMs = fechaFin - fechaInicio;

  console.log(`\n${separator}`);
  console.log(`  📊 RESUMEN DEL CICLO`);
  console.log(`     • Procesados  : ${scraped.length}`);
  console.log(`     • Guardados   : ${guardados}`);
  console.log(`     • Duplicados  : ${duplicadosOmitidos}`);
  console.log(`     • Errores     : ${errores}`);
  console.log(`     • Duración    : ${duracionMs}ms`);
  console.log(`${separator}\n`);

  // ── Persistir log en MongoDB ──────────────────────────────────────────────
  try {
    await CronLog.create({
      fechaInicio,
      fechaFin,
      duracionMs,
      procesados: scraped.length,
      guardados,
      duplicados: duplicadosOmitidos,
      errores,
      detalle,
    });
    console.log(`  💾 Log persistido en MongoDB (colección: cronlogs)\n`);
  } catch (logErr) {
    console.error('  ❌ Error guardando log:', logErr.message);
  }
}

// ─── Conexión a MongoDB y arranque ───────────────────────────────────────────

async function iniciar() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI no definido. Verificá backend/.env');
    process.exit(1);
  }
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY no definido. Verificá backend/.env');
    process.exit(1);
  }

  console.log('🔌 Conectando a MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB Atlas');

  await ejecutarCiclo();

  // '* * * * *'   → cada 1 minuto  (testing)
  // '0 */6 * * *' → cada 6 horas  (producción)
  const CRON_INTERVAL = '* * * * *';

  console.log(`⏰ Cron programado: "${CRON_INTERVAL}" (cada 1 min para testing)`);
  console.log('   Cambiá a "0 */6 * * *" para producción.\n');

  cron.schedule(CRON_INTERVAL, async () => {
    await ejecutarCiclo();
  });
}

iniciar().catch((err) => {
  console.error('💥 Error fatal al iniciar:', err.message);
  process.exit(1);
});
