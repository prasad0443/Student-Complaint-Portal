const { Router } = require('express');
const { restrictToStaff } = require('../middleware/auth');
const { summary } = require('../controllers/analyticsController');

const router = Router();

router.get('/summary', restrictToStaff, summary);

module.exports = router;
