const Horario = require('../models/Horario');
const Cita = require('../models/Cita');
const Servicio = require('../models/Servicio');
const Barbero = require('../models/Barbero');
const { DIAS, aMinutos, aHora, diaDeFecha, fechaValida, hoyEnISO } = require('../utils/tiempo');

// GET /api/horarios?barbero=id - disponibilidad semanal de un barbero
async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.barbero) filtro.barbero = req.query.barbero;

    const horarios = await Horario.find(filtro).populate('barbero', 'nombre');
    horarios.sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));
    res.json(horarios);
  } catch (e) {
    next(e);
  }
}

// POST /api/horarios - crear bloque de disponibilidad (administrador)
async function crear(req, res, next) {
  try {
    const { barbero, diaSemana, horaInicio, horaFin } = req.body;
    if (!barbero || diaSemana === undefined || !horaInicio || !horaFin) {
      return res.status(400).json({ mensaje: 'Barbero, dia, hora de inicio y fin son obligatorios' });
    }
    if (aMinutos(horaFin) <= aMinutos(horaInicio)) {
      return res.status(400).json({ mensaje: 'La hora de fin debe ser posterior a la de inicio' });
    }

    const existe = await Barbero.findById(barbero);
    if (!existe) return res.status(404).json({ mensaje: 'Barbero no encontrado' });

    const horario = await Horario.create({ barbero, diaSemana, horaInicio, horaFin });
    res.status(201).json(horario);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ mensaje: 'Ese bloque de horario ya esta configurado' });
    }
    next(e);
  }
}

// DELETE /api/horarios/:id - eliminar bloque (administrador)
async function eliminar(req, res, next) {
  try {
    const horario = await Horario.findByIdAndDelete(req.params.id);
    if (!horario) return res.status(404).json({ mensaje: 'Horario no encontrado' });
    res.json({ mensaje: 'Horario eliminado' });
  } catch (e) {
    next(e);
  }
}

// GET /api/horarios/disponibilidad?barbero=&fecha=&servicio=
// REGLA DE NEGOCIO: devuelve solo las horas LIBRES de un barbero en una fecha
async function disponibilidad(req, res, next) {
  try {
    const { barbero, fecha } = req.query;
    if (!barbero || !fechaValida(fecha)) {
      return res.status(400).json({ mensaje: 'Debe indicar barbero y una fecha valida (YYYY-MM-DD)' });
    }

    const barberoDoc = await Barbero.findOne({ _id: barbero, activo: true });
    if (!barberoDoc) return res.status(404).json({ mensaje: 'Barbero no encontrado o inactivo' });

    // Duracion del servicio elegido (por defecto 30 minutos)
    let duracion = 30;
    if (req.query.servicio) {
      const servicio = await Servicio.findById(req.query.servicio);
      if (servicio) duracion = servicio.duracionMin;
    }

    const dia = diaDeFecha(fecha);
    const bloques = await Horario.find({ barbero, diaSemana: dia });

    // Tramos ya ocupados por citas activas
    const ocupadas = await Cita.find({ barbero, fecha, activa: true });
    const tramos = ocupadas.map((c) => ({
      inicio: aMinutos(c.hora),
      fin: aMinutos(c.hora) + c.duracionMin
    }));

    const hoy = hoyEnISO();
    const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
    const horas = [];

    for (const b of bloques) {
      const inicio = aMinutos(b.horaInicio);
      const fin = aMinutos(b.horaFin);
      for (let t = inicio; t + duracion <= fin; t += 30) {
        if (fecha === hoy && t <= ahoraMin) continue; // no agenda horas ya pasadas
        const libre = !tramos.some((o) => t < o.fin && o.inicio < t + duracion);
        if (libre) horas.push(aHora(t));
      }
    }

    res.json({
      barbero: barberoDoc.nombre,
      fecha,
      dia: DIAS[dia],
      duracionMin: duracion,
      horas: [...new Set(horas)] // por si dos bloques del dia se solapan
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { listar, crear, eliminar, disponibilidad };
