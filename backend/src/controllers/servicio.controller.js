const Servicio = require('../models/Servicio');

// GET /api/servicios - catalogo publico (?todos=1 incluye los inactivos)
async function listar(req, res, next) {
  try {
    const filtro = req.query.todos === '1' ? {} : { activo: true };
    const servicios = await Servicio.find(filtro).sort('nombre');
    res.json(servicios);
  } catch (e) {
    next(e);
  }
}

// POST /api/servicios - crear servicio (administrador)
async function crear(req, res, next) {
  try {
    const { nombre, descripcion, precio, duracionMin } = req.body;
    if (!nombre || precio === undefined || !duracionMin) {
      return res.status(400).json({ mensaje: 'Nombre, precio y duracion son obligatorios' });
    }
    const servicio = await Servicio.create({ nombre, descripcion, precio, duracionMin });
    res.status(201).json(servicio);
  } catch (e) {
    next(e);
  }
}

// PUT /api/servicios/:id - editar servicio (administrador)
async function editar(req, res, next) {
  try {
    const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!servicio) return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    res.json(servicio);
  } catch (e) {
    next(e);
  }
}

// DELETE /api/servicios/:id - desactivar servicio (administrador)
async function desactivar(req, res, next) {
  try {
    const servicio = await Servicio.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
    if (!servicio) return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    res.json({ mensaje: 'Servicio desactivado', servicio });
  } catch (e) {
    next(e);
  }
}

module.exports = { listar, crear, editar, desactivar };
