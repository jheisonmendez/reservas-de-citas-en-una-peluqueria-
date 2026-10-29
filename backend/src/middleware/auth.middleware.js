const jwt = require('jsonwebtoken');
const config = require('../config');

function extraerToken(req) {
  const cabecera = req.headers.authorization || '';
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
}

// Protege rutas: exige un token valido
function requiereAuth(req, res, next) {
  const token = extraerToken(req);
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });
  try {
    req.usuario = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ mensaje: 'Token invalido o expirado' });
  }
}

// Protege rutas: exige un rol especifico (administrador)
function requiereRol(rol) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ mensaje: 'No autenticado' });
    if (req.usuario.rol !== rol) {
      return res.status(403).json({ mensaje: 'No tiene permisos para esta operacion' });
    }
    next();
  };
}

module.exports = { requiereAuth, requiereRol };
