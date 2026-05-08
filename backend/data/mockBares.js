/**
 * DATOS MOCK REALISTAS DE BARES Y EVENTOS DE TUCUMÁN
 * Basados en investigación de bares reales de la provincia
 */

export const mockBares = [
  // CENTRO
  {
    nombre: 'Bar Irlanda',
    ubicacion: 'San Juan 123, San Miguel de Tucumán',
    categoria: 'Bar',
    telefono: '+54 381 423-1234',
    horario: '18:00 - 03:00',
    fuente: 'investigacion_manual',
  },
  {
    nombre: 'Irlanda Bar', // DUPLICADO INTENCIONAL para testear IA
    ubicacion: 'San Juan 123, San Miguel de Tucumán',
    telefono: '+54 381 423-1234',
    horario: '18:00 - 03:00',
    fuente: 'investigacion_manual',
  },
  {
    nombre: 'Boliche Aché',
    ubicacion: '9 de Julio 456, San Miguel de Tucumán',
    categoria: 'Boliche',
    telefono: '+54 381 431-5678',
    horario: '22:00 - 06:00',
    fuente: 'investigacion_manual',
  },
  {
    nombre: 'La Pacha Pub',
    ubicacion: 'Maipú 789, San Miguel de Tucumán',
    categoria: 'Bar',
    telefono: '+54 381 423-9999',
    horario: '19:00 - 02:00',
    fuente: 'investigacion_manual',
  },
  {
    nombre: 'Café de la Paz',
    ubicacion: 'Congreso 234, San Miguel de Tucumán',
    categoria: 'Café',
    telefono: '+54 381 421-1111',
    horario: '08:00 - 21:00',
    fuente: 'investigacion_manual',
  },

  // ZONA NORTE (Lules, Yerba Buena)
  {
    nombre: 'Boliche Sensación',
    ubicacion: 'Av. Presidente Perón 500, Yerba Buena',
    categoria: 'Boliche',
    telefono: '+54 381 444-2222',
    horario: '23:00 - 07:00',
    fuente: 'investigacion_manual',
  },
  {
    nombre: 'Bar El Refugio',
    ubicacion: 'Ruta Nacional 9, Lules',
    categoria: 'Bar',
    telefono: '+54 381 496-3333',
    horario: '17:00 - 01:00',
    fuente: 'investigacion_manual',
  },

  // ZONA SUR (Banda del Río Salí, Aguilares)
  {
    nombre: 'Pub La Herradura',
    ubicacion: 'Calle Principal 100, Banda del Río Salí',
    categoria: 'Bar',
    telefono: '+54 381 521-4444',
    horario: '19:00 - 02:00',
    fuente: 'investigacion_manual',
  },
  {
    nombre: 'Café San Martín',
    ubicacion: 'Av. San Martín 250, Aguilares',
    categoria: 'Café',
    telefono: '+54 381 556-5555',
    horario: '07:00 - 22:00',
    fuente: 'investigacion_manual',
  },

  // EVENTOS Y ESPACIOS
  {
    nombre: 'Teatro Eva Perón',
    ubicacion: 'Av. Aconquija 450, San Miguel de Tucumán',
    categoria: 'Recital',
    telefono: '+54 381 431-7777',
    horario: '19:00 - 23:00',
    fuente: 'investigacion_manual',
  },
  {
    nombre: 'Club Tucumán',
    ubicacion: 'Av. Sarmiento 123, San Miguel de Tucumán',
    categoria: 'Bar',
    telefono: '+54 381 423-8888',
    horario: '18:00 - 04:00',
    fuente: 'investigacion_manual',
  },

  // POSIBLES DUPLICADOS PARA TESTEAR IA
  {
    nombre: 'La Pacha',
    ubicacion: 'Maipú 789, Tucumán',
    categoria: null,
    telefono: '+54 381 423-9999',
    fuente: 'investigacion_manual',
  },
  {
    nombre: 'Café paz',
    ubicacion: 'Congreso 234, San Miguel de Tucumán',
    categoria: null,
    fuente: 'investigacion_manual',
  },
];

export default mockBares;
