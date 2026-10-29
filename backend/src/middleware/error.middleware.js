// Manejador unico de errores: toda ruta que lance una excepcion llega aqui.
function noEncontrado(req, res) {
  res.status(404).json({ mensaje: 'Recurso no encontrado: ' + req.originalUrl });
}

function manejadorErrores(err, req, res, next) {
  console.error('[ERROR]', err.message);

  if (err.code === 11000) {
    return res.status(409).json({
      mensaje: 'Ya existe un registro con esos datos (clave duplicada)',
      detalle: err.keyValue
    });
  }

  res.status(err.status || 500).json({
    mensaje: err.mensaje || 'Error interno del servidor',
    detalle: err.message
  });
}

module.exports = { noEncontrado, manejadorErrores };
