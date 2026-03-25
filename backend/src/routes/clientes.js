const router = require('express').Router();
const {
  listarClientes,
  obtenerCliente,
  crearCliente,
  editarCliente,
  eliminarCliente,
} = require('../controllers/clientesController');
const verificarToken = require('../middleware/verificarToken');
const solodueno = require('../middleware/solodueno');

router.use(verificarToken);

router.get('/', listarClientes);
router.get('/:id', obtenerCliente);
router.post('/', crearCliente);
router.put('/:id', editarCliente);
router.delete('/:id', solodueno, eliminarCliente);

module.exports = router;
