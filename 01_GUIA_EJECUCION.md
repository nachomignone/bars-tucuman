# 🚀 GUÍA DE EJECUCIÓN - BACKEND

## ¿QUÉ ACABAMOS DE CREAR?

Un **Backend completo** con:
- ✅ API REST (CRUD)
- ✅ Base de datos MongoDB
- ✅ Integración con Gemini API (IA)
- ✅ Deduplicación automática
- ✅ Clasificación de categorías
- ✅ Datos mock realistas

---

## 📋 PASO 1: INSTALAR DEPENDENCIAS

Abre **Git Bash** en la carpeta `backend`:

```bash
cd "C:\Users\pc\OneDrive\Documentos\Proyectos Claude\Prueba Técnica Zoco\backend"
npm install
```

Esto descargará todas las librerías necesarias. **Toma 2-3 minutos.**

---

## ✅ PASO 2: VERIFICAR EL ARCHIVO .env

Abre el archivo `.env` que creé:

```
MONGODB_URI=mongodb+srv://mignonejuanignacio_db_user:Nachito2710@cluster0.wevqmuk.mongodb.net/bars_tucuman?appName=Cluster0
GEMINI_API_KEY=AIzaSy...
PORT=5000
NODE_ENV=development
```

**Verifica:**
- ✅ MONGODB_URI es correcta
- ✅ GEMINI_API_KEY es la tuya (completa)

Si falta la API Key, actualiza el archivo.

---

## 🗄️ PASO 3: CARGAR DATOS INICIALES

Ejecuta el script que carga los datos mock:

```bash
npm run seed
```

Deberías ver algo así:

```
✅ Base de datos poblada exitosamente
📊 Se insertaron 13 bares
Bares insertados:
1. Bar Irlanda - San Juan 123, San Miguel de Tucumán
2. Irlanda Bar - San Juan 123, San Miguel de Tucumán
...
```

**¿Qué pasó?**
- Se conectó a MongoDB Atlas
- Limpió bares previos
- Insertó 13 bares de prueba
- Algunos son duplicados intencionalmente para testear IA

---

## 🎮 PASO 4: INICIAR EL SERVIDOR

```bash
npm run dev
```

Deberías ver:

```
🔄 Conectando a MongoDB Atlas...
✅ MongoDB conectado exitosamente
═══════════════════════════════════════
🚀 Servidor ejecutándose en puerto 5000
═══════════════════════════════════════
📍 Local: http://localhost:5000
📍 API: http://localhost:5000/api/bares
📍 Health: http://localhost:5000/api/health
═══════════════════════════════════════
```

✅ **¡Servidor activo!**

---

## 🧪 PASO 5: TESTEAR LA API

Abre **Postman**, **Insomnia** o usa **curl** en otra terminal.

### A) Health Check (verifica que está vivo)
```bash
curl http://localhost:5000/api/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2024-05-06T...",
  "message": "✅ Servidor funcionando correctamente"
}
```

### B) Obtener TODOS los bares
```bash
curl http://localhost:5000/api/bares
```

Verás todos los 13 bares en JSON.

### C) Obtener ESTADÍSTICAS
```bash
curl http://localhost:5000/api/bares/estadisticas/resumen
```

Respuesta:
```json
{
  "success": true,
  "estadisticas": {
    "totalBares": 13,
    "baresActivos": 13,
    "baresInactivos": 0,
    "clasificadosPorIA": 0,
    "posiblesDuplicados": 0,
    "distribucionPorCategoria": [...]
  }
}
```

### D) CREAR UN BAR NUEVO (con IA)

**Con Postman/Insomnia:**
- Método: **POST**
- URL: `http://localhost:5000/api/bares`
- Body (JSON):
```json
{
  "nombre": "Bar El Rincón",
  "ubicacion": "Av. Aconquija 999, Tucumán"
}
```

**Con curl:**
```bash
curl -X POST http://localhost:5000/api/bares \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Bar El Rincón","ubicacion":"Av. Aconquija 999"}'
```

**¿Qué pasa?**
1. ✅ Valida datos
2. 🤖 Gemini clasifica automáticamente (sin categoría especificada)
3. 🔍 Busca posibles duplicados
4. 💾 Guarda en MongoDB
5. 📊 Retorna el bar creado con categoría asignada

---

## 📊 PASO 6: ENTENDER LA RESPUESTA CON IA

Cuando creas un bar, la respuesta incluye:

```json
{
  "success": true,
  "mensaje": "Bar creado exitosamente",
  "data": {
    "_id": "...",
    "nombre": "Bar El Rincón",
    "ubicacion": "Av. Aconquija 999",
    "categoria": "Bar",              // ← Clasificado por IA
    "clasificadoPorIA": true,        // ← Flag de IA
    "posibleDuplicadoDe": null,      // ← Sin duplicados
    "confianzaDeduplicacion": 0
  },
  "avisos": []
}
```

---

## 🔍 PASO 7: TESTEAR DEDUPLICACIÓN

Intenta crear un bar casi idéntico:

```json
{
  "nombre": "Bar El Rincón Tucumán",
  "ubicacion": "Av. Aconquija 999, San Miguel de Tucumán"
}
```

**Respuesta:**
```json
{
  "avisos": [
    "⚠️ Posible duplicado detectado (confianza: 85%)"
  ]
}
```

La IA detectó que probablemente es el mismo bar (con nombre/ubicación ligeramente diferentes).

---

## 📝 ENDPOINTS DISPONIBLES

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/bares` | Obtener todos los bares |
| GET | `/api/bares/:id` | Obtener un bar por ID |
| GET | `/api/bares/estadisticas/resumen` | Estadísticas |
| POST | `/api/bares` | Crear bar (con IA) |
| PUT | `/api/bares/:id` | Actualizar bar |
| PATCH | `/api/bares/:id/desactivar` | Desactivar (soft delete) |
| DELETE | `/api/bares/:id` | Eliminar permanentemente |

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "Cannot find module '@google/generative-ai'"
```bash
npm install @google/generative-ai
```

### ❌ "MongoDB connection timeout"
- Verifica que tu IP esté en la whitelist de MongoDB Atlas
- En Atlas: Network Access → Add Current IP

### ❌ "GEMINI_API_KEY no está definida"
- Verifica que `.env` tenga tu API Key correcta
- Asegúrate de copiar la COMPLETA (empieza con `AIza`)

### ❌ "Port 5000 already in use"
```bash
# En Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# O cambia PORT en .env a 3000 o 8000
```

---

## 📚 CONCEPTOS QUE ESTÁS APRENDIENDO

### 1. **CRUD**
- **C**reate: POST (crear)
- **R**ead: GET (leer)
- **U**pdate: PUT (actualizar)
- **D**elete: DELETE (eliminar)

### 2. **MONGODB**
- Almacena datos en "Documentos" JSON
- Cada bar es un documento
- Indexados para búsqueda rápida

### 3. **GEMINI API (IA)**
- Clasifica categorías automáticamente
- Detecta duplicados inteligentemente
- Sin costo (incluido en presupuesto gratis)

### 4. **EXPRESS**
- Framework para crear APIs
- Define rutas, middlewares, errores
- Comunica front ↔ back

---

## ✅ CHECKLIST

- [ ] npm install completado
- [ ] .env verificado
- [ ] npm run seed ejecutado
- [ ] npm run dev corriendo
- [ ] Health check funciona
- [ ] GET /api/bares retorna datos
- [ ] POST crea bar nuevo
- [ ] Deduplicación detecta duplicados

**¿Todo OK?** ✅ **Continuamos con el Frontend** 🎨

---

## 🎯 PRÓXIMO PASO

Una vez confirmado que todo funciona, crearemos:
- **Frontend en React** (dashboard para ver/editar bares)
- **Automatización** (script que carga datos automáticamente)
- **Documentación final** (README para GitHub)

¿Listo? 🚀
