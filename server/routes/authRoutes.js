const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, me, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect, verifyTokenMatchesUser } = require('../middleware/auth');

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
    body('name').trim().notEmpty().withMessage('Name required'),
    body('studentId').trim().notEmpty().withMessage('Student ID required'),
  ],
  register
);

router.post(
  '/login',
  [
    body('password').notEmpty().withMessage('Password required'),
    body('identifier').optional().trim(),
    body('email').optional().trim(),
    body('studentId').optional().trim(),
  ],
  login
);

router.get('/me', protect, verifyTokenMatchesUser, me);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('token').notEmpty().withMessage('Reset token required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  ],
  resetPassword
);

module.exports = router;
