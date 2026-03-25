const router = require('express').Router();
const {
  listarClientes,
  obtenerCliente,
  crearCliente,
  editarCliente,
  eliminarCliente,
} = require('../controllers/clientesController');

router.get('/', listarClientes);
router.get('/:id', obtenerCliente);
router.post('/', crearCliente);
router.put('/:id', editarCliente);
router.delete('/:id', eliminarCliente);

module.exports = router;
