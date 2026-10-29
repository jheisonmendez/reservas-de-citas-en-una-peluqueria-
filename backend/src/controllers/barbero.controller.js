const Barbero = require('../models/Barbero');

// GET /api/barberos - equipo de barberos (publico)
async function listar(req, res, next) {
  try {
    const filtro = req.query.todos === '1' ? {} : { activo: true };
    const barberos = await Barbero.find(filtro).sort('nombre');
    res.json(barberos);
  } catch (e) {
    next(e);
  }
}

// POST /api/barberos - crear barbero (administrador)
async function crear(req, res, next) {
  try {
    const { nombre, telefono, especialidad } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
    const barbero = await Barbero.create({ nombre, telefono, especialidad });
    res.status(201).json(barbero);
  } catch (e) {
    next(e);
  }
}

// PUT /api/barberos/:id - editar barbero (administrador)
async function editar(req, res, next) {
  try {
    const barbero = await Barbero.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!barbero) return res.status(404).json({ mensaje: 'Barbero no encontrado' });
    res.json(barbero);
  } catch (e) {
    next(e);
  }
}

// DELETE /api/barberos/:id - desactivar barbero (administrador)
async function desactivar(req, res, next) {
  try {
    const barbero = await Barbero.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
    if (!barbero) return res.status(404).json({ mensaje: 'Barbero no encontrado' });
    res.json({ mensaje: 'Barbero desactivado', barbero });
  } catch (e) {
    next(e);
  }
}

module.exports = { listar, crear, editar, desactivar };
