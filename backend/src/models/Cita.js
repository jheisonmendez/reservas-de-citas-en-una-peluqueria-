const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    barbero: { type: mongoose.Schema.Types.ObjectId, ref: 'Barbero', required: true },
    servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: true },
    fecha: { type: String, required: true }, // YYYY-MM-DD
    hora: { type: String, required: true }, // HH:mm
    // Regla de negocio: dos citas activas no pueden ocupar el mismo barbero al mismo tiempo.
    // Se desactiva (activa: false) cuando la cita se cancela, liberando el espacio.
    activa: { type: Boolean, default: true },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmada', 'completada', 'cancelada'],
      default: 'pendiente'
    },
    // Copia de valores al momento de reservar, para no perder datos si cambia el catálogo
    servicioNombre: { type: String, default: '' },
    precio: { type: Number, default: 0 },
    duracionMin: { type: Number, default: 30 },
    clienteNombre: { type: String, default: '' },
    barberoNombre: { type: String, default: '' },
    notas: { type: String, default: '' }
  },
  { timestamps: true }
);

// Unicidad a nivel de base de datos: un barbero solo puede tener una cita ACTIVA por fecha y hora
citaSchema.index(
  { barbero: 1, fecha: 1, hora: 1 },
  { unique: true, partialFilterExpression: { activa: true } }
);
citaSchema.index({ cliente: 1, fecha: 1 });

module.exports = mongoose.model('Cita', citaSchema);
