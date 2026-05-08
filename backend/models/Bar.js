import mongoose from 'mongoose';

const barSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    ubicacion: {
      type: String,
      required: true,
      trim: true,
    },
    categoria: {
      type: String,
      enum: ['Bar', 'Boliche', 'Café', 'Recital', 'Otro'],
      default: 'Otro',
    },
    telefono: {
      type: String,
      trim: true,
    },
    horario: {
      type: String,
      trim: true,
    },
    fuente: {
      type: String,
      default: 'investigación_manual',
    },
    activo: {
      type: Boolean,
      default: true,
    },
    clasificadoPorIA: {
      type: Boolean,
      default: false,
    },
    confianzaDeduplicacion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    posibleDuplicadoDe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bar',
      default: null,
    },
    notas: {
      type: String,
      trim: true,
    },
    fechaObtenccion: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Índices para búsqueda rápida y deduplicación
barSchema.index({ nombre: 'text', ubicacion: 'text' });
barSchema.index({ nombre: 1, ubicacion: 1 });
barSchema.index({ activo: 1 });

const Bar = mongoose.model('Bar', barSchema);

export default Bar;
