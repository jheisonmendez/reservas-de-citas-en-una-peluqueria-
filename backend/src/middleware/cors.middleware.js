const config = require('../config');

// Control de acceso CORS: permite que el frontend web (:5173) y la aplicacion
// movil (:5174) consuman la API que corre en otro puerto (:4000).
function cors(req, res, next) {
  const origen = req.headers.origin;

  if (origen && config.ORIGENES_CORS.includes(origen)) {
    res.setHeader('Access-Control-Allow-Origin', origen);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // El navegador envia una peticion "preflight" OPTIONS antes de las mutaciones
  if (req.method === 'OPTIONS') return res.status(204).end();

  next();
}

module.exports = cors;
