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
export const clasificarBar = async (nombre, ubicacion) => {
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
    const categoriaClasificada = categoriasValidas.includes(text) ? text : 'Otro';

    console.log(`✅ Clasificado: "${nombre}" → ${categoriaClasificada}`);
    return categoriaClasificada;
  } catch (error) {
    console.error('❌ Error clasificando con IA:', error.message);
    return 'Otro';
  }
};

/**
 * Detectar si dos bares son posibles duplicados
 * @param {object} bar1 - Primer bar
 * @param {object} bar2 - Segundo bar
 * @returns {Promise<object>} {esDuplicado: boolean, confianza: number, motivo: string}
 */
export const detectarDuplicado = async (bar1, bar2) => {
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

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{"esDuplicado": true, "confianza": 85, "motivo": "mismo nombre reordenado"}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 80,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { esDuplicado: false, confianza: 0, motivo: 'No se pudo procesar' };
    }

    const respuesta = JSON.parse(jsonMatch[0]);
    console.log(`🔍 Comparando "${bar1.nombre}" vs "${bar2.nombre}" → ${respuesta.esDuplicado ? '⚠️ DUPLICADO' : '✅ Diferentes'} (confianza: ${respuesta.confianza}%)`);

    return respuesta;
  } catch (error) {
    console.error('❌ Error detectando duplicado:', error.message);
    return { esDuplicado: false, confianza: 0, motivo: 'Error en procesamiento' };
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

export default { clasificarBar, detectarDuplicado, generarDescripcion };
