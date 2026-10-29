const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const { requiereAuth, requiereRol } = require('../middleware/auth.middleware');

router.post('/registro', auth.registro);
router.post('/login', auth.login);
router.get('/perfil', requiereAuth, auth.perfil);
router.get('/usuarios', requiereAuth, requiereRol('administrador'), auth.listarClientes);

module.exports = router;
