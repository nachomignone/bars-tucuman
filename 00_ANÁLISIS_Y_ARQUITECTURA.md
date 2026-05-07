# PRUEBA TÉCNICA ZOCO - ANÁLISIS Y ARQUITECTURA

## 📋 RESUMEN DE REQUISITOS

### Objetivo Principal
Crear un sistema automatizado que obtiene, procesa y administra eventos/bares de Tucumán.

### Partes a Completar (por importancia % evaluación)
1. **Ejecución y Funcionamiento** (25%)
2. **Automatización** (20%)
3. **Uso de IA** (20%)
4. **Manejo de Duplicados** (15%)
5. **Calidad de Código** (10%)
6. **README** (5%)
7. **Plus Diferencial** (5%)

---

## 🎯 CONCEPTOS CLAVE A ENTENDER

### 1. SCRAPING vs API vs MOCK DATA
- **Scraping**: Extraer datos de un sitio web HTML. Riesgos: bloqueos, cambios en la estructura
- **API**: Obtener datos de forma estructurada. Ventaja: confiable y autorizado
- **Mock Data**: Simular datos para testing. Ventaja: sin dependencias externas

### 2. DUPLICADOS Y DEDUPLICACIÓN
Problema: Dos registros pueden ser el mismo aunque tengan nombres diferentes
- "Bar Irlanda Tucumán" vs "Irlanda Bar" → Mismo lugar
- Soluciones:
  - Comparación exacta de nombre + ubicación
  - Similitud de strings (Levenshtein distance)
  - **IA**: Clasificar pares como "duplicado" o "distinto"

### 3. AUTOMATIZACIÓN
Ejecutar el flujo sin intervención manual:
- Scheduler (cada X horas/días)
- Procesar nuevos datos
- Detectar duplicados automáticamente
- Guardar resultados y logs

### 4. USO DE IA (OBLIGATORIO)
Mínimo una aplicación de:
- Clasificación de categoría (bar, boliche, café, etc.)
- Detección de duplicados por similitud semántica
- Generación de descripciones
- Normalización de direcciones

---

## 🏗️ ARQUITECTURA RECOMENDADA

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│          (Next.js/React + Dashboard)                │
│  - Listado de bares/eventos                         │
│  - CRUD manual                                      │
│  - Visualización de logs                            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│                   API BACKEND                       │
│              (Node.js/FastAPI)                      │
│  - Rutas CRUD (GET, POST, PUT, DELETE)             │
│  - Lógica de deduplicación                          │
│  - Llamadas a IA                                    │
│  - Validaciones                                     │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│                   BASE DE DATOS                     │
│             (MongoDB/PostgreSQL)                    │
│  - Colección: bares/eventos                         │
│  - Índices para búsqueda rápida                     │
│  - Historial de cambios (opcional)                  │
└─────────────────────────────────────────────────────┘
                 ▲
                 │
┌────────────────┴────────────────────────────────────┐
│          AUTOMATIZACIÓN (n8n/Script)                │
│  - Obtener datos (scraping/API/mock)               │
│  - Procesar y limpiar                              │
│  - Detectar duplicados (IA)                        │
│  - Insertar en BD                                  │
│  - Logs y notificaciones                           │
└─────────────────────────────────────────────────────┘
```

---

## 📦 STACK RECOMENDADO (OPTIMIZADO)

| Componente | Opción Recomendada | Alternativa |
|-----------|-------------------|-------------|
| **Obtención de datos** | Mock data + simular scraping | BeautifulSoup (Python) |
| **Backend** | Node.js + Express | Python + FastAPI |
| **Base de datos** | MongoDB (flexible) | PostgreSQL (robusto) |
| **Frontend** | Next.js + React | Vue.js |
| **Automatización** | Script Node.js + node-cron | n8n (más visual) |
| **IA** | Anthropic Claude API | OpenAI GPT-4 |
| **Validación** | Zod o Joi | Pydantic (Python) |

---

## 🔄 FLUJO GENERAL

### PARTE 1: Obtención de Datos
```javascript
// Simulamos obtener datos de una "API"
const mockBares = [
  { nombre: "Bar Irlanda", ubicacion: "San Juan 123", categoria: null },
  { nombre: "Irlanda Bar", ubicacion: "San Juan 123", categoria: null },
  // ...
]
```

### PARTE 2: CRUD
```javascript
// Operaciones básicas
POST   /api/bares           // Crear
GET    /api/bares           // Listar (con filtros)
GET    /api/bares/:id       // Obtener uno
PUT    /api/bares/:id       // Actualizar
DELETE /api/bares/:id       // Eliminar
```

### PARTE 3: Automatización
```javascript
// Script que se ejecuta cada X tiempo
async function fetchAndProcess() {
  const nuevos = await obtenerDatos();
  const procesados = await procesarDatos(nuevos);
  const deduplicados = await detectarDuplicados(procesados);
  await guardarEnBD(deduplicados);
  await enviarLogs();
}

// Ejecutar cada 6 horas
cron.schedule('0 */6 * * *', fetchAndProcess);
```

### PARTE 4: Integración de IA
```javascript
// Usar Claude API para clasificar
const clasificacion = await claude.messages.create({
  model: "claude-opus-4-6",
  messages: [{
    role: "user",
    content: `Clasifica esto como: bar, boliche, café, recital o otro.
    "${bare.nombre} - ${bare.ubicacion}"
    Responde solo la categoría.`
  }]
});

bare.categoria = clasificacion.content[0].text.trim();
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] **PARTE 1**: Obtener datos (mock o scraping)
- [ ] **PARTE 2**: CRUD completo con validaciones
- [ ] **PARTE 3**: Script de automatización con logs
- [ ] **PARTE 4**: Integración de IA (clasificación o deduplicación)
- [ ] **PARTE 5**: Documento técnico explicando decisiones
- [ ] **BONUS**: Dashboard simple
- [ ] **BONUS**: Notificaciones o historial
- [ ] **ENTREGABLES**: Repo + README + Screenshots

---

## 🚀 PRÓXIMOS PASOS

1. **Crear estructura de carpetas**
2. **Configurar base de datos**
3. **Implementar API CRUD**
4. **Crear script de obtención de datos**
5. **Integrar IA**
6. **Automatizar con scheduler**
7. **Crear frontend (dashboard)**
8. **Documentar en README**
9. **Subir a GitHub**

---

## 💡 CONSEJOS PARA DESTACAR (Plus Diferencial)

1. **Deduplicación inteligente**: Usar IA para detectar "Irlanda Bar" vs "Bar Irlanda"
2. **Geolocalización**: Mostrar ubicaciones en mapa
3. **Notificaciones**: Email/Slack cuando se agrega nuevo evento
4. **API pública**: Que otros accedan a los datos
5. **Testing**: Tests unitarios y de integración
6. **Docker**: Containerizar la aplicación
7. **Documentación OpenAPI**: Swagger de tu API

---

## 📚 TIEMPO ESTIMADO

| Tarea | Horas |
|-------|-------|
| Setup y estructura | 1 |
| Backend + BD | 6 |
| Frontend (MVP) | 4 |
| Automatización | 3 |
| IA Integration | 3 |
| Testing y bugs | 2 |
| Documentación | 2 |
| Extras (bonus) | 2-4 |
| **TOTAL** | **23-27 horas** |

✅ Hay tiempo suficiente para 48 horas
