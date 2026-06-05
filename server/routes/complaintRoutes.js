const { Router } = require('express');
const { body, param } = require('express-validator');
const { upload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { restrictTo, restrictToStaff } = require('../middleware/auth');
const {
  summary,
  list,
  getOne,
  create,
  update,
  remove,
  exportPdf,
} = require('../controllers/complaintController');
const { TIMELINE_STATUSES } = require('../models/Complaint');

const router = Router();

router.get('/export/pdf', exportPdf);
router.get('/stats/summary', summary);

router.get('/', list);

router.get('/:id', [param('id').isMongoId(), validate], getOne);

router.post(
  '/',
  restrictTo('student'),
  upload.array('attachments', 5),
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('category').isIn(['academics', 'hostel', 'IT', 'fees', 'others']),
    body('description').trim().notEmpty().isLength({ max: 10000 }),
    body('isAnonymous')
      .optional()
      .custom((v) => v === undefined || ['true', 'false', true, false, '1', '0', ''].includes(v)),
    body('anonymous')
      .optional()
      .custom((v) => v === undefined || ['true', 'false', true, false, '1', '0', ''].includes(v)),
  ],
  validate,
  create
);

router.put(
  '/:id',
  restrictToStaff,
  [
    param('id').isMongoId(),
    body('status').optional().isIn(TIMELINE_STATUSES),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('department').optional().isString(),
    body('adminNote').optional().isString(),
    body('timelineNote').optional().isString(),
  ],
  validate,
  update
);

router.delete('/:id', [param('id').isMongoId(), validate], remove);

module.exports = router;
