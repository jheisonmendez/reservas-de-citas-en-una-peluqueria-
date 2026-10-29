// Punto de entrada de la API: agrupa todos los recursos bajo /api
const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/servicios', require('./servicio.routes'));
router.use('/barberos', require('./barbero.routes'));
router.use('/horarios', require('./horario.routes'));
router.use('/citas', require('./cita.routes'));

// Comprobacion rapida de que la API esta viva (la usan el frontend y la movil)
router.get('/salud', (req, res) =>
  res.json({ estado: 'ok', base: 'MongoDB', puerto: require('../config').PUERTO })
);

module.exports = router;
