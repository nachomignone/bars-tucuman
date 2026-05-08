import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Clasificar un bar usando IA
 * @param {string} nombre - Nombre del bar
 * @param {string} ubicacion - Ubicación del bar
 * @returns {Promise<string>} Categoría clasificada
 */
export const clasificarBar = async (nombre, ubicacion, horario = '', telefono = '') => {
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
2. Inferencia por horario: horario de madrugada (00:00-06:00) → probable Boliche | horario matutino (07:00-14:00) → probable Café | horario nocturno extendido (20:00-03:00) → probable Bar
3. Inferencia por ubicación: si menciona shopping o centro comercial → probable Café o Restaurante (Otro) | si menciona zona céntrica nocturna de Tucumán → probable Bar o Boliche
4. Referencias culturales: "Irlanda", "Irish", "Celtic", "O'Brien", "Murphy" → Bar | "Jazz", "Blues", "Folk" → Bar o Recital

FALLBACK OBLIGATORIO: Si el nombre es abstracto (ej: "La Esquina", "El Galpón", "El Refugio") Y no tenés horario ni ubicación suficiente para inferir con seguridad → respondé OBLIGATORIAMENTE "Otro". No adivines.

Responde SOLO con la categoría exacta: Bar, Boliche, Café, Recital u Otro. Sin explicación, sin puntuación extra.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    const text = completion.choices[0]?.message?.content?.trim() || 'Otro';
    const categoriasValidas = ['Bar', 'Boliche', 'Café', 'Recital', 'Otro'];
    const categoriaClasificada = categoriasValidas.includes(text) ? text : 'Otro';

    console.log(`✅ Clasificado: "${nombre}" → ${categoriaClasificada}`);
    return categoriaClasificada;
  } catch (error) {
    console.error('❌ Error clasificando con IA:', error.message);
    return 'Otro';
  }
};

/**
 * Detectar el mejor candidato duplicado de una lista — batch prompting.
 * Una sola llamada a Groq evalúa todos los candidatos simultáneamente.
 *
 * @param {object} barNuevo  - { nombre, ubicacion, telefono }
 * @param {Array}  candidatos - [{ _id, nombre, ubicacion, telefono }, ...]
 * @returns {Promise<{ duplicadoId: string|null, confianza: number, motivo: string }>}
 */
export const detectarMejorDuplicado = async (barNuevo, candidatos) => {
  if (!candidatos.length) return { duplicadoId: null, confianza: 0, motivo: 'Sin candidatos' };

  try {
    // Construir la lista de candidatos para el prompt
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
Tu tarea: identificar cuál candidato (si alguno) es el MISMO establecimiento que el bar nuevo, ingresado por error o con datos ligeramente distintos.

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
E) Nombres parecidos pero distintos (ej: "Bar La Esquina" vs "Bar Esquina") → usar ubicación y teléfono para decidir
F) Diferencias de tildes, mayúsculas o artículos (el/la/los) no indican establecimientos distintos

Evaluá TODOS los candidatos y devolvé el que tenga MAYOR probabilidad de ser duplicado del bar nuevo.
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

    const encontrado = respuesta.duplicadoId && respuesta.duplicadoId !== 'null';
    console.log(
      `🔍 Batch dedup "${barNuevo.nombre}" vs ${candidatos.length} candidato(s) → ${encontrado ? `⚠️ DUPLICADO id:${respuesta.duplicadoId}` : '✅ Único'} (confianza: ${respuesta.confianza}%)`
    );

    return respuesta;
  } catch (error) {
    console.error('❌ Error detectando duplicado:', error.message);
    return { duplicadoId: null, confianza: 0, motivo: 'Error en procesamiento' };
  }
};

/**
 * Generar descripción de un bar
 * @param {string} nombre - Nombre del bar
 * @param {string} categoria - Categoría del bar
 * @returns {Promise<string>} Descripción generada
 */
export const generarDescripcion = async (nombre, categoria) => {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Genera una descripción breve (máximo 2 líneas) para este ${categoria.toLowerCase()}:
"${nombre}" en Tucumán, Argentina.

Sé creativo pero realista. No inventes datos específicos.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('❌ Error generando descripción:', error.message);
    return '';
  }
};

export default { clasificarBar, detectarMejorDuplicado, generarDescripcion };
