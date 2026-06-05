const { Router } = require('express');
const { download } = require('../controllers/fileController');

const router = Router();

router.get('/*', (req, res, next) => {
  req.params.key = req.params[0];
  download(req, res, next);
});

module.exports = router;
