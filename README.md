# 🍺 Zoco — Sistema de Gestión de Bares y Eventos · Tucumán

> Sistema fullstack para obtener, procesar y administrar bares de Tucumán de forma automatizada, con clasificación y deduplicación inteligente usando IA.

---

## ✅ Checklist de Requisitos

| Parte | Requisito | Estado |
|-------|-----------|--------|
| 1 | Obtención de datos (scraping / mock) | ✅ Mock data de bares reales de Tucumán |
| 2 | CRUD completo | ✅ 7 endpoints REST + Frontend React |
| 2 | Campos requeridos (nombre, ubicación, categoría, fuente) | ✅ + teléfono, horario, notas, timestamps |
| 3 | Automatización con ejecución periódica | ✅ Script standalone con node-cron |
| 3 | Evitar duplicados | ✅ Pre-filtro MongoDB + Batch Prompting con Groq |
| 3 | Registrar resultados (logs) | ✅ Colección `cronlogs` en MongoDB Atlas |
| 4 | Clasificación con IA | ✅ Groq llama-3.3-70b-versatile |
| 4 | Detección de duplicados con IA | ✅ Batch prompting con reglas franquicia/tipeo |
| **Bonus** | Dashboard UI | ✅ React + Tailwind + React Query v5 |
| **Bonus** | Historial de cambios | ✅ CronLog persistido en MongoDB |

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     MONOREPO                            │
│                                                         │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │   frontend/  │────▶│   backend/   │                  │
│  │  React + Vite│     │ Express 5000 │                  │
│  │  Puerto 5173 │     │              │                  │
│  └──────────────┘     │  REST API    │                  │
│                       │  7 endpoints │                  │
│  ┌──────────────┐     │              │                  │
│  │   scripts/   │────▶│  MongoDB     │                  │
│  │  node-cron   │     │  Atlas       │                  │
│  │  automation  │     │              │                  │
│  └──────┬───────┘     └──────┬───────┘                  │
│         │                   │                           │
│         └──────────┬────────┘                           │
│                    ▼                                    │
│             ┌─────────────┐                             │
│             │  Groq API   │                             │
│             │ llama-3.3   │                             │
│             │ Clasificar  │                             │
│             │ Deduplicar  │                             │
│             └─────────────┘                             │
└─────────────────────────────────────────────────────────┘

Flujo de automatización (cada ciclo):
Scraping mock → normalizarTexto() → MongoDB $regex → Groq Batch → Guardar | Omitir → CronLog
```

---

## 🚀 Guía de Ejecución Rápida

### Requisitos previos
- Node.js v18+
- Cuenta en MongoDB Atlas (o URI propia)

### Variables de entorno

Crear `backend/.env` con:

```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/bars_tucuman
GROQ_API_KEY=<tu_api_key>
PORT=5000
```

> **Nota para el evaluador:** La API Key de Groq se adjunta por separado para facilitar la revisión. El modelo utilizado es `llama-3.3-70b-versatile` con tier gratuito — no requiere tarjeta de crédito.

### 1. Backend (puerto 5000)

```bash
cd backend
npm install
npm run dev
```

Verificar: `http://localhost:5000/api/health`

### 2. Frontend (puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

Abrir: `http://localhost:5173`

### 3. Script de automatización (cron)

```bash
cd scripts
npm install
npm start
```

El script corre inmediatamente y luego cada 1 minuto (modo testing).
Para producción, cambiar en `automation.js`:
```js
const CRON_INTERVAL = '0 */6 * * *'; // cada 6 horas
```

### Endpoints disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/bares` | Listar bares (filtros: activo, categoria, busqueda) |
| GET | `/api/bares/:id` | Obtener bar por ID |
| POST | `/api/bares` | Crear bar (clasifica y deduplica automáticamente) |
| PUT | `/api/bares/:id` | Actualizar bar |
| PATCH | `/api/bares/:id/desactivar` | Soft delete |
| DELETE | `/api/bares/:id` | Eliminar permanentemente |
| GET | `/api/bares/estadisticas/resumen` | KPIs y distribución por categoría |

---

## 🧠 Criterio Técnico (Parte 5)

### ¿Cómo evitamos duplicados?

La deduplicación tiene dos capas que se ejecutan en secuencia en cada creación:

**Capa 1 — Pre-filtro en MongoDB:**

Se aplica `normalizarTexto()` al nombre del bar entrante: pasa a minúsculas, quita tildes y elimina stop words genéricas (`bar`, `boliche`, `pub`, `el`, `la`, `los`, `las`, `de`, `del`). Las palabras significativas resultantes forman un `$regex` dinámico que busca candidatos en MongoDB con `.limit(10)` para no superar el límite de tokens de la API.

```
"El Bar Irlanda" → ["irlanda"] → $regex: /irlanda/i
"Antares Tucumán" → ["antares", "tucuman"] → $regex: /antares|tucuman/i
```

Edge cases cubiertos:
- **Array vacío** (nombre solo con stop words, ej: "El Bar"): fallback a búsqueda exacta `^nombre$`
- **Cero candidatos**: se saltea la llamada a Groq directamente
- **Exceso de candidatos**: hard limit de 10 para proteger el rate limit de la API

**Capa 2 — Batch Prompting con Groq:**

En lugar de iterar candidato por candidato (N llamadas), se envía una única llamada con todos los candidatos y el bar nuevo. El modelo evalúa el conjunto completo y devuelve el ID del mejor match junto con confianza y motivo.

El prompt distingue explícitamente dos escenarios:
- **Error de tipeo:** mismo nombre + misma calle con número casi igual (1060 vs 1064) → Duplicado, confianza 85-95%
- **Franquicia/sucursal:** mismo nombre + calles totalmente distintas → No duplicado, confianza 20-40%

El teléfono actúa como señal de desempate: si coincide, aumenta la confianza de duplicado; si difiere entre misma dirección, puede indicar error de carga.

Si la confianza supera 70%, el sistema marca el registro con `posibleDuplicadoDe` (referencia al original) y `confianzaDeduplicacion`. **El sistema nunca rechaza automáticamente** — la decisión final queda en manos del operador, visible en el dashboard con badge de advertencia.

---

### ¿Cómo escalaríamos?

**Base de datos:**
- Índices compuestos en MongoDB: `{ nombre: 1, activo: 1 }` y `{ ubicacion: 1 }` para acelerar el pre-filtro
- Migrar a **MongoDB Atlas Vector Search** para deduplicación semántica: convertir nombres a embeddings y buscar por similitud coseno en vez de regex. Esto resuelve casos como "Antares" vs "Cervecería Antares" que el regex no captura

**Procesamiento:**
- Mover el script de automatización a una cola de mensajes (**RabbitMQ** o **AWS SQS**): cada bar scrapeado se encola como mensaje independiente, múltiples workers lo procesan en paralelo
- Separar la clasificación de la deduplicación en microservicios independientes para escalar cada uno por su propio bottleneck

**API de IA:**
- Implementar un **caché de clasificaciones** (Redis): si el mismo nombre ya fue clasificado, devolver el resultado cacheado sin llamar a Groq
- Migrar a un tier pago de Groq o a un modelo propio fine-tuneado con datos de bares argentinos para eliminar el límite de TPM

**Frontend:**
- Paginación server-side en el endpoint de bares (actualmente trae todos)
- Implementar WebSockets para que el dashboard se actualice en tiempo real cuando el cron agrega bares

---

### ¿Qué problemas puede tener este flujo?

**Falsos negativos residuales:** el pre-filtro de Capa 1 puede no encontrar candidatos si el nombre del bar nuevo usa palabras completamente distintas a las del duplicado existente (ej: apodo vs nombre oficial). En ese caso, nunca se llega a la Capa 2.

**Límite de TPM en Groq (tier gratuito):** si el script corre con frecuencia alta o hay muchos candidatos por ciclo, la API puede devolver error 429. Mitigado con `.limit(10)` en la Capa 1 y el cron de 6 horas en producción.

**Scraping simulado:** los datos mock no reflejan la variabilidad real de fuentes web (encoding, formatos de dirección inconsistentes, campos faltantes). En producción, un scraper real requeriría normalización adicional de direcciones.

**Sin re-análisis retroactivo:** los registros ya existentes en la DB no se re-evalúan cuando mejora el prompt de deduplicación. Un bar duplicado que entró antes del refactor permanece sin el badge de advertencia.

**Clasificación por nombre únicamente limitada:** bares con nombres abstractos ("El Galpón", "La Esquina") sin horario ni ubicación informativa caen en "Otro" por diseño (fallback obligatorio). Requieren corrección manual.

---

### ¿Cómo mejoraríamos la calidad de los datos?

**Validación en ingesta:**
- Agregar **Zod** en el frontend para validar el formulario antes de enviar (formatos de teléfono, horario, longitud de campos)
- Validación a nivel de schema en Mongoose con mensajes de error descriptivos (ya implementado parcialmente)

**Normalización de direcciones:**
- Integrar **Google Maps Geocoding API** o **Nominatim (OpenStreetMap)** para normalizar direcciones al momento de la carga. "San Martín 765" y "Av. San Martín 765" serían la misma dirección normalizada, mejorando drásticamente la precisión del pre-filtro

**Fuentes múltiples:**
- Cruzar datos entre fuentes (scraping + carga manual + API pública) y usar el campo `fuente` para calcular un score de confianza por registro. Un bar que aparece en 3 fuentes distintas tiene mayor calidad que uno ingresado manualmente una sola vez

**Feedback loop:**
- Registrar las decisiones del operador (cuando confirma o descarta un duplicado sugerido) y usarlas para ajustar el umbral de confianza dinámicamente por categoría

**Agente IA conversacional (bonus no implementado):**
- Un agente que responda preguntas en lenguaje natural sobre los datos ("¿cuántos bares nuevos se agregaron esta semana?", "¿qué bares tienen horario de madrugada?") usando los datos de MongoDB como contexto

---

## 🛠 Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Base de datos | MongoDB Atlas + Mongoose |
| Frontend | React 19 + Vite + Tailwind CSS |
| Estado servidor | TanStack React Query v5 |
| HTTP client | Axios |
| IA | Groq API — llama-3.3-70b-versatile |
| Automatización | node-cron |
| Control de versiones | Git — monorepo |

> **Nota sobre la elección de Groq:** el proyecto inició con Google Gemini, pero durante el desarrollo se agotó el cupo del tier gratuito. Se migró a Groq (llama-3.3-70b-versatile) que ofrece un tier gratuito más generoso y latencias más bajas. La migración no requirió cambiar ningún prompt — solo el cliente de SDK.

---

## 📁 Estructura del Proyecto

```
bars-tucuman/
├── backend/
│   ├── config/
│   │   └── database.js          # Conexión MongoDB
│   ├── controllers/
│   │   └── barController.js     # Lógica CRUD + deduplicación
│   ├── models/
│   │   └── Bar.js               # Schema Mongoose
│   ├── routes/
│   │   └── bars.js              # Definición de endpoints
│   ├── utils/
│   │   └── aiService.js         # Groq: clasificarBar + detectarMejorDuplicado
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/
│       │   └── baresApi.js      # Cliente Axios centralizado
│       ├── hooks/
│       │   └── useBares.js      # React Query hooks
│       ├── components/
│       │   ├── BarCard.jsx
│       │   ├── BarForm.jsx
│       │   ├── BarList.jsx
│       │   └── Estadisticas.jsx
│       └── pages/
│           └── Dashboard.jsx
└── scripts/
    └── automation.js            # Cron worker standalone
```
