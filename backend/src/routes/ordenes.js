const router = require('express').Router();
const {
  listarOrdenes,
  obtenerOrden,
  crearOrden,
  editarOrden,
  cambiarEstado,
  eliminarOrden,
  finalizarPresupuesto,
} = require('../controllers/ordenesController');
const { agregarItem } = require('../controllers/itemsController');
const { registrarPago, listarPagos } = require('../controllers/pagosController');
const { descargarRecibo, enviarRecibo } = require('../controllers/reciboController');

router.get('/', listarOrdenes);
router.get('/:id', obtenerOrden);
router.post('/', crearOrden);
router.put('/:id', editarOrden);
router.patch('/:id/estado', cambiarEstado);
router.put('/:id/finalizar-presupuesto', finalizarPresupuesto);
router.delete('/:id', eliminarOrden);

// Ítems anidados
router.post('/:id/items', agregarItem);

// Pagos anidados
router.post('/:id/pagos', registrarPago);
router.get('/:id/pagos', listarPagos);

// PDF y email
router.get('/:id/recibo', descargarRecibo);
router.post('/:id/enviar-recibo', enviarRecibo);

module.exports = router;
