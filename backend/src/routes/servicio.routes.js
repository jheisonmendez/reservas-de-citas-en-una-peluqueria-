const router = require('express').Router();
const servicio = require('../controllers/servicio.controller');
const { requiereAuth, requiereRol } = require('../middleware/auth.middleware');

router.get('/', servicio.listar);
router.post('/', requiereAuth, requiereRol('administrador'), servicio.crear);
router.put('/:id', requiereAuth, requiereRol('administrador'), servicio.editar);
router.delete('/:id', requiereAuth, requiereRol('administrador'), servicio.desactivar);

module.exports = router;
