const router = require('express').Router();
const {
  listarVehiculos,
  obtenerVehiculo,
  buscarPorPatente,
  crearVehiculo,
  editarVehiculo,
  eliminarVehiculo,
} = require('../controllers/vehiculosController');
const verificarToken = require('../middleware/verificarToken');
const solodueno = require('../middleware/solodueno');

router.use(verificarToken);

router.get('/', listarVehiculos);
router.get('/patente/:patente', buscarPorPatente);
router.get('/:id', obtenerVehiculo);
router.post('/', crearVehiculo);
router.put('/:id', editarVehiculo);
router.delete('/:id', solodueno, eliminarVehiculo);

module.exports = router;
