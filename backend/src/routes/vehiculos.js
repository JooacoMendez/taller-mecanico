const router = require('express').Router();
const {
  listarVehiculos,
  obtenerVehiculo,
  buscarPorPatente,
  crearVehiculo,
  editarVehiculo,
  eliminarVehiculo,
} = require('../controllers/vehiculosController');

router.get('/', listarVehiculos);
router.get('/patente/:patente', buscarPorPatente);
router.get('/:id', obtenerVehiculo);
router.post('/', crearVehiculo);
router.put('/:id', editarVehiculo);
router.delete('/:id', eliminarVehiculo);

module.exports = router;
