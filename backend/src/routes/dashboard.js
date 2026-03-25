const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');

router.get('/', getDashboard);
router.get('/export', require('../controllers/dashboardController').exportarExcel);

module.exports = router;
