const Cita = require('../models/Cita');
const Barbero = require('../models/Barbero');
const Servicio = require('../models/Servicio');
const Horario = require('../models/Horario');
const { aMinutos, aHora, fechaValida, hoyEnISO, DIAS, diaDeFecha } = require('../utils/tiempo');

// GET /api/citas/mias - citas del cliente autenticado (aplicacion movil)
async function misCitas(req, res, next) {
  try {
    const citas = await Cita.find({ cliente: req.usuario.id })
      .populate('barbero', 'nombre especialidad')
      .populate('servicio', 'nombre precio duracionMin')
      .sort({ fecha: -1, hora: -1 });
    res.json(citas);
  } catch (e) {
    next(e);
  }
}

// GET /api/citas - todas las citas (solo administrador, panel web)
async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.fecha) filtro.fecha = req.query.fecha;
    if (req.query.estado) filtro.estado = req.query.estado;

    const citas = await Cita.find(filtro)
      .populate('cliente', 'nombre email telefono')
      .populate('barbero', 'nombre')
      .populate('servicio', 'nombre precio duracionMin')
      .sort({ fecha: -1, hora: -1 });
    res.json(citas);
  } catch (e) {
    next(e);
  }
}

// POST /api/citas - crear cita (cliente desde la movil o admin desde la web)
// AQUI se aplican las reglas de negocio de no cruzar horarios.
async function crear(req, res, next) {
  try {
    const { barbero, servicio, fecha, hora, notas } = req.body;
    const clienteId = req.usuario.rol === 'cliente' ? req.usuario.id : req.body.cliente;

    if (!clienteId || !barbero || !servicio || !fecha || !hora) {
      return res.status(400).json({ mensaje: 'Cliente, barbero, servicio, fecha y hora son obligatorios' });
    }

    const horaLimpia = (hora || '').slice(0, 5); // acepta HH:mm o HH:mm:ss
    if (!fechaValida(fecha)) return res.status(400).json({ mensaje: 'Fecha invalida (use YYYY-MM-DD)' });
    if (fecha < hoyEnISO()) return res.status(400).json({ mensaje: 'No se pueden agendar citas en el pasado' });
    if (!/^\d{2}:\d{2}$/.test(horaLimpia)) return res.status(400).json({ mensaje: 'Hora invalida (use HH:mm)' });

    const barberoDoc = await Barbero.findOne({ _id: barbero, activo: true });
    if (!barberoDoc) return res.status(404).json({ mensaje: 'Barbero no encontrado o inactivo' });

    const servicioDoc = await Servicio.findOne({ _id: servicio, activo: true });
    if (!servicioDoc) return res.status(404).json({ mensaje: 'Servicio no encontrado o inactivo' });

    // 1) Validacion en la aplicacion: la nueva cita no debe cruzarse con otra
    const activas = await Cita.find({ barbero, fecha, activa: true });
    const ini = aMinutos(horaLimpia);
    const fin = ini + servicioDoc.duracionMin;
    const conflicto = activas.find((c) => {
      const cIni = aMinutos(c.hora);
      const cFin = cIni + c.duracionMin;
      return ini < cFin && cIni < fin; // superposicion de intervalos
    });
    if (conflicto) {
      return res.status(409).json({
        mensaje: `El barbero ${barberoDoc.nombre} ya tiene una cita de ${conflicto.hora} a ${aHora(
          aMinutos(conflicto.hora) + conflicto.duracionMin
        )} el ${fecha}. Elija otra hora.`
      });
    }

    // 2) Validacion en la aplicacion: debe caer dentro de un horario de atencion
    const dia = diaDeFecha(fecha);
    const bloques = await Horario.find({ barbero, diaSemana: dia });
    const dentroDeHorario = bloques.some(
      (b) => ini >= aMinutos(b.horaInicio) && fin <= aMinutos(b.horaFin)
    );
    if (!dentroDeHorario) {
      return res.status(409).json({
        mensaje: `${barberoDoc.nombre} no atiende ese dia o a esa hora (${DIAS[dia]}). Elija un horario disponible.`
      });
    }

    // 3) Validacion en la base de datos: indice unico parcial barbero+fecha+hora (activa = true)
    const cita = await Cita.create({
      cliente: clienteId,
      barbero,
      servicio,
      fecha,
      hora: horaLimpia,
      notas: notas || '',
      servicioNombre: servicioDoc.nombre,
      precio: servicioDoc.precio,
      duracionMin: servicioDoc.duracionMin,
      clienteNombre: req.usuario.nombre,
      barberoNombre: barberoDoc.nombre
    });

    res.status(201).json(cita);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({
        mensaje: 'Ese horario acaba de ser reservado para este barbero. Elija otra hora.'
      });
    }
    next(e);
  }
}

// PATCH /api/citas/:id/estado - confirmar / completar / cancelar (administrador)
async function actualizarEstado(req, res, next) {
  try {
    const { estado } = req.body;
    const permitidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (!permitidos.includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado no valido' });
    }

    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });

    cita.estado = estado;
    cita.activa = estado !== 'cancelada'; // al cancelar se libera el horario
    await cita.save();
    res.json(cita);
  } catch (e) {
    next(e);
  }
}

// PATCH /api/citas/:id/cancelar - el cliente cancela su propia cita y libera la hora
async function cancelar(req, res, next) {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });

    const esSuya = String(cita.cliente) === req.usuario.id;
    if (!esSuya && req.usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'Solo puede cancelar sus propias citas' });
    }
    if (cita.estado === 'completada') {
      return res.status(409).json({ mensaje: 'Una cita completada no puede cancelarse' });
    }

    cita.estado = 'cancelada';
    cita.activa = false; // libera el horario para otra reserva
    await cita.save();
    res.json({ mensaje: 'Cita cancelada', cita });
  } catch (e) {
    next(e);
  }
}

module.exports = { misCitas, listar, crear, actualizarEstado, cancelar };
