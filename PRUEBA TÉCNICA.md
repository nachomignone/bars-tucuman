# **PRUEBA TÉCNICA** 

Evaluar tu capacidad para:

* Automatizar procesos reales  
* Trabajar con datos externos (scraping / APIs)  
* Usar IA de forma práctica  
* Proponer mejoras

# **CONSIGNA**

Desarrollar un sistema que obtenga, procese y administre eventos o bares de Tucumán de forma automatizada.

# **PARTE 1 – Obtención de datos (Scraping / API)**

Construir un proceso que:

* Obtenga eventos o bares desde:  
  * Una web pública (scraping)  
  * API pública  
  * Dataset (también válido)

Debe:

* Extraer datos relevantes (nombre, ubicación, fecha si aplica, etc.)  
* Evitar scraping agresivo  
* Manejar errores básicos

👉 IMPORTANTE:  
 Si no querés scrapear directamente, podés simular la fuente con datos mock.

**PARTE 2 – CRUD**

Crear un sistema que permita:

* Guardar los datos obtenidos  
* Listarlos  
* Editarlos  
* Eliminarlos o desactivarlos

Campos sugeridos:

* Nombre  
* Ubicación  
* Categoría  
* Fuente  
* Fecha de obtención

# 

# **PARTE 3 – AUTOMATIZACIÓN (CLAVE)**

Crear un flujo (n8n, Make, Zapier o script) que:

* Ejecute la carga de datos automáticamente  
* Procese la información  
* Evite duplicados  
* Registre resultados (logs)

Ejemplo:

* “Cada vez que ejecuto el flujo → se agregan nuevos bares/eventos”

# **PARTE 4 – USO DE IA (OBLIGATORIO)**

Aplicar IA en al menos UNA de estas:

* Clasificar eventos/bares (ej: bar, boliche, café, recital, etc.)  
* Limpiar datos (nombres duplicados o inconsistentes)  
* Generar descripciones  
* Detectar duplicados aunque el nombre sea distinto  
* Normalizar direcciones

Ejemplo:

“Bar Irlanda Tucumán” y “Irlanda Bar” → detectar posible duplicado

# 

# **PARTE 5 – CRITERIO TÉCNICO**

Explicar brevemente:

* ¿Cómo evitás duplicados?  
* ¿Cómo escalarías este sistema?  
* ¿Qué problemas puede tener este flujo?  
* ¿Cómo mejorarías la calidad de los datos?

# 

# **BONUS (MUY VALORADO)**

* Dashboard simple  
* Notificaciones (Slack, email)  
* Historial de cambios  
* Sistema de aprobación manual  
* Agente IA que responda sobre los datos  
* Automatizaciones adicionales  
* Mejoras no solicitadas

---

# **STACK SUGERIDO**

* Node.js / Python  
* Next.js / React  
* MongoDB / SQL / Supabase  
* n8n / Make / Zapier  
* APIs de IA(Nodos, etc)

# **ENTREGABLES**

* Repo GitHub  
* README claro  
* Export o screenshots del flujo  
* (Opcional) video corto

# **TIEMPO**

Hasta **48 horas**

## **Criterios de evaluación**

* Ejecución y funcionamiento: 25%.  
* Automatización: 20%.  
* Uso práctico de IA: 20%.  
* Manejo de datos y duplicados: 15%.  
* Calidad del código: 10%.  
* Claridad del README: 5%.  
* Plus diferencial: 5%.