const router = require('express').Router();
const cita = require('../controllers/cita.controller');
const { requiereAuth, requiereRol } = require('../middleware/auth.middleware');

router.get('/mias', requiereAuth, cita.misCitas);
router.get('/', requiereAuth, requiereRol('administrador'), cita.listar);
router.post('/', requiereAuth, cita.crear);
router.patch('/:id/estado', requiereAuth, requiereRol('administrador'), cita.actualizarEstado);
router.patch('/:id/cancelar', requiereAuth, cita.cancelar);

module.exports = router;
