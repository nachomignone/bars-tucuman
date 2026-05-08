import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Clasificar un bar usando IA
 * @param {string} nombre - Nombre del bar
 * @param {string} ubicacion - Ubicación del bar
 * @returns {Promise<string>} Categoría clasificada
 */
export const clasificarBar = async (nombre, ubicacion) => {
  try {
    const prompt = `Clasifica el siguiente lugar en UNA de estas categorías: Bar, Boliche, Café, Recital, Otro.

Nombre: "${nombre}"
Ubicación: "${ubicacion}"

Responde SOLO con la categoría, sin explicación.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Validar que sea una categoría válida
    const categoriasValidas = ['Bar', 'Boliche', 'Café', 'Recital', 'Otro'];
    const categoriaClasificada = categoriasValidas.includes(text) ? text : 'Otro';

    console.log(`✅ Clasificado: "${nombre}" → ${categoriaClasificada}`);
    return categoriaClasificada;
  } catch (error) {
    console.error('❌ Error clasificando con Gemini:', error.message);
    return 'Otro';
  }
};

/**
 * Detectar si dos bares son posibles duplicados
 * @param {object} bar1 - Primer bar
 * @param {object} bar2 - Segundo bar
 * @returns {Promise<object>} {esDuplicado: boolean, confianza: number}
 */
export const detectarDuplicado = async (bar1, bar2) => {
  try {
    const prompt = `Analiza si estos dos bares son el MISMO establecimiento (duplicados):

Bar 1:
- Nombre: "${bar1.nombre}"
- Ubicación: "${bar1.ubicacion}"

Bar 2:
- Nombre: "${bar2.nombre}"
- Ubicación: "${bar2.ubicacion}"

Ejemplos de duplicados:
- "Bar Irlanda" y "Irlanda Bar" (mismo lugar, nombre diferente)
- "Boliche Aché" y "Boliche Ache" (mismo lugar, sin tilde)

Responde con JSON válido:
{"esDuplicado": true/false, "confianza": 0-100, "motivo": "explicación breve"}`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Extraer JSON de la respuesta
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
    const prompt = `Genera una descripción breve (máximo 2 líneas) para este ${categoria.toLowerCase()}:
"${nombre}" en Tucumán, Argentina.

Sé creativo pero realista. No inventes datos específicos.`;

    const result = await model.generateContent(prompt);
    const descripcion = result.response.text().trim();
    return descripcion;
  } catch (error) {
    console.error('❌ Error generando descripción:', error.message);
    return '';
  }
};

export default {
  clasificarBar,
  detectarDuplicado,
  generarDescripcion,
};
