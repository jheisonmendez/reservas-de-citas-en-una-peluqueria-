const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    precio: { type: Number, required: true, min: 0 },
    duracionMin: { type: Number, required: true, min: 10, max: 240 },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Servicio', servicioSchema);
