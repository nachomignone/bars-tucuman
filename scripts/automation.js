/**
 * automation.js — Script de automatización de scraping y clasificación de bares
 * Tucumán, Argentina
 *
 * Ejecuta un ciclo de scraping simulado cada 6 horas (configurable).
 * Clasifica bares con IA (Groq / llama-3.3-70b-versatile).
 * Detecta y marca duplicados automáticamente.
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

// Cargar variables desde backend/.env (scripts no tiene su propio .env)
dotenv.config({ path: join(__dirname, '../backend/.env') });

// ─── Groq Client ──────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// ─── Schema de Bar (autónomo, sin depender de backend/) ───────────────────────
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

// Evitar re-registrar el modelo si ya existe (por hot-reload)
const Bar = mongoose.models.Bar || mongoose.model('Bar', barSchema);

// ─── Funciones de IA ──────────────────────────────────────────────────────────

async function clasificarBar(nombre, ubicacion) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Clasifica el siguiente lugar en UNA de estas categorías: Bar, Boliche, Café, Recital, Otro.

Nombre: "${nombre}"
Ubicación: "${ubicacion}"

Responde SOLO con la categoría, sin explicación.`,
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

async function detectarDuplicado(bar1, bar2) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Analiza si estos dos bares son el MISMO establecimiento (duplicados):

Bar 1:
- Nombre: "${bar1.nombre}"
- Ubicación: "${bar1.ubicacion}"

Bar 2:
- Nombre: "${bar2.nombre}"
- Ubicación: "${bar2.ubicacion}"

Ejemplos de duplicados:
- "Bar Irlanda" y "Irlanda Bar" (mismo lugar, nombre diferente)
- "Boliche Aché" y "Boliche Ache" (mismo lugar, sin tilde)

IMPORTANTE: Responde ÚNICAMENTE con el JSON, nada más antes ni después:
{"esDuplicado": true, "confianza": 85, "motivo": "mismo nombre reordenado"}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 80,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';

    // Extraer JSON aunque el modelo agregue texto antes/después
    const jsonMatch = responseText.match(/\{[^{}]*"esDuplicado"[^{}]*\}/);
    if (!jsonMatch) {
      console.error('  ⚠️  Respuesta IA no parseable:', responseText.slice(0, 100));
      return { esDuplicado: false, confianza: 0, motivo: 'No se pudo procesar' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    // Normalizar: confianza puede venir como string "85%" o número 85
    if (typeof parsed.confianza === 'string') {
      parsed.confianza = parseInt(parsed.confianza, 10) || 0;
    }
    return parsed;
  } catch (error) {
    console.error('  ❌ Error detectando duplicado:', error.message);
    return { esDuplicado: false, confianza: 0, motivo: 'Error en procesamiento' };
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
  console.log(`\n${separator}`);
  console.log(`  🤖 CICLO DE SCRAPING — ${new Date().toLocaleString('es-AR')}`);
  console.log(`${separator}`);

  const scraped = obtenerBaresScraped();
  console.log(`  📋 Bares encontrados en scraping: ${scraped.length}`);

  let guardados = 0;
  let duplicadosOmitidos = 0;

  for (const barData of scraped) {
    console.log(`\n  ▶ Procesando: "${barData.nombre}"`);

    // 1. Clasificar con IA
    const categoria = await clasificarBar(barData.nombre, barData.ubicacion);
    console.log(`     🏷  Categoría IA: ${categoria}`);

    // 2. Buscar posibles duplicados en DB
    const posiblesDuplicados = await Bar.find({
      nombre: { $regex: barData.nombre.split(' ')[0], $options: 'i' },
      activo: true,
    });

    let esDuplicado = false;
    let refDuplicado = null;
    let confianza = 0;

    if (posiblesDuplicados.length > 0) {
      console.log(`     🔍 Comparando contra ${posiblesDuplicados.length} bar(es) existente(s)...`);

      for (const existente of posiblesDuplicados) {
        const resultado = await detectarDuplicado(barData, existente);
        console.log(
          `     → vs "${existente.nombre}": ${resultado.esDuplicado ? '⚠️ DUPLICADO' : '✅ Diferente'} (confianza: ${resultado.confianza}%)`
        );

        if (resultado.esDuplicado && resultado.confianza > 70) {
          esDuplicado = true;
          refDuplicado = existente._id;
          confianza = resultado.confianza;
          break;
        }
      }
    }

    if (esDuplicado) {
      console.log(`     ⏭  Omitido — duplicado con confianza ${confianza}%`);
      duplicadosOmitidos++;
      continue;
    }

    // 3. Guardar en MongoDB
    const nuevoBar = new Bar({
      nombre: barData.nombre.trim(),
      ubicacion: barData.ubicacion.trim(),
      categoria,
      telefono: barData.telefono || '',
      horario: barData.horario || '',
      fuente: 'scraping_automatico',
      clasificadoPorIA: true,
      posibleDuplicadoDe: refDuplicado,
      confianzaDeduplicacion: confianza,
    });

    await nuevoBar.save();
    console.log(`     ✅ Guardado en MongoDB (id: ${nuevoBar._id})`);
    guardados++;
  }

  console.log(`\n${separator}`);
  console.log(`  📊 RESUMEN DEL CICLO`);
  console.log(`     • Procesados  : ${scraped.length}`);
  console.log(`     • Guardados   : ${guardados}`);
  console.log(`     • Duplicados  : ${duplicadosOmitidos}`);
  console.log(`${separator}\n`);
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

  // Ejecutar inmediatamente al arrancar
  await ejecutarCiclo();

  // Programar ciclos futuros
  // '* * * * *'    → cada 1 minuto  (testing)
  // '0 */6 * * *'  → cada 6 horas  (producción)
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
