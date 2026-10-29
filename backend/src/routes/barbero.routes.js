const router = require('express').Router();
const barbero = require('../controllers/barbero.controller');
const { requiereAuth, requiereRol } = require('../middleware/auth.middleware');

router.get('/', barbero.listar);
router.post('/', requiereAuth, requiereRol('administrador'), barbero.crear);
router.put('/:id', requiereAuth, requiereRol('administrador'), barbero.editar);
router.delete('/:id', requiereAuth, requiereRol('administrador'), barbero.desactivar);

module.exports = router;
