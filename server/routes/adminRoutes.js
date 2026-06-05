const { Router } = require('express');
const { body } = require('express-validator');
const { protect, restrictTo, verifyTokenMatchesUser } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { login, register, me } = require('../controllers/adminController');

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login
);

router.post(
  '/register',
  protect,
  verifyTokenMatchesUser,
  restrictTo('super_admin'),
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 characters'),
    body('name').trim().notEmpty().isLength({ max: 120 }).withMessage('Name required'),
  ],
  validate,
  register
);

router.get('/me', protect, verifyTokenMatchesUser, me);

module.exports = router;
