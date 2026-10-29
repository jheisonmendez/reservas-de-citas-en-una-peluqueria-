const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const config = require('../config');

function firmar(usuario) {
  return jwt.sign(
    { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRA }
  );
}

function datosPublicos(u) {
  return { id: u._id, nombre: u.nombre, email: u.email, telefono: u.telefono, rol: u.rol };
}

// POST /api/auth/registro - registro de clientes desde la aplicacion movil
async function registro(req, res, next) {
  try {
    const { nombre, email, password, telefono } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, email y password son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ mensaje: 'El password debe tener al menos 6 caracteres' });
    }

    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese email' });

    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, email, password: hash, telefono: telefono || '', rol: 'cliente' });

    res.status(201).json({ token: firmar(usuario), usuario: datosPublicos(usuario) });
  } catch (e) {
    next(e);
  }
}

// POST /api/auth/login - la usan la web (administrador) y la movil (clientes)
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email: (email || '').toLowerCase(), activo: true });
    if (!usuario) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const ok = await bcrypt.compare(password || '', usuario.password);
    if (!ok) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    res.json({ token: firmar(usuario), usuario: datosPublicos(usuario) });
  } catch (e) {
    next(e);
  }
}

// GET /api/auth/perfil - datos del usuario autenticado
async function perfil(req, res, next) {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    res.json(usuario);
  } catch (e) {
    next(e);
  }
}

// GET /api/auth/usuarios - listado de clientes (solo administrador)
async function listarClientes(req, res, next) {
  try {
    const usuarios = await Usuario.find({ rol: 'cliente', activo: true }).sort('nombre');
    res.json(usuarios);
  } catch (e) {
    next(e);
  }
}

module.exports = { registro, login, perfil, listarClientes };
