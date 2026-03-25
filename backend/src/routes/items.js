const router = require('express').Router();
const { editarItem, eliminarItem } = require('../controllers/itemsController');
const verificarToken = require('../middleware/verificarToken');

router.use(verificarToken);

router.put('/:id', editarItem);
router.delete('/:id', eliminarItem);

module.exports = router;
