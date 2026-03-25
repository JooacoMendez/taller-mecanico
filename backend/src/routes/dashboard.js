const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');
const verificarToken = require('../middleware/verificarToken');

router.use(verificarToken);

router.get('/', getDashboard);

module.exports = router;
