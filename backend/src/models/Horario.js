const mongoose = require('mongoose');

// Disponibilidad semanal de un barbero (ej: lunes 09:00 a 18:00)
const horarioSchema = new mongoose.Schema(
  {
    barbero: { type: mongoose.Schema.Types.ObjectId, ref: 'Barbero', required: true },
    diaSemana: { type: Number, required: true, min: 0, max: 6 }, // 0 = domingo ... 6 = sabado
    horaInicio: { type: String, required: true }, // HH:mm
    horaFin: { type: String, required: true } // HH:mm
  },
  { timestamps: true }
);

horarioSchema.index({ barbero: 1, diaSemana: 1, horaInicio: 1 }, { unique: true });

module.exports = mongoose.model('Horario', horarioSchema);
