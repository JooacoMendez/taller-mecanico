const router = require('express').Router();
const { editarItem, eliminarItem } = require('../controllers/itemsController');

router.put('/:id', editarItem);
router.delete('/:id', eliminarItem);

module.exports = router;
