const router = require('express').Router();
const horario = require('../controllers/horario.controller');
const { requiereAuth, requiereRol } = require('../middleware/auth.middleware');

router.get('/disponibilidad', horario.disponibilidad); // debe ir antes de /:id
router.get('/', horario.listar);
router.post('/', requiereAuth, requiereRol('administrador'), horario.crear);
router.delete('/:id', requiereAuth, requiereRol('administrador'), horario.eliminar);

module.exports = router;
