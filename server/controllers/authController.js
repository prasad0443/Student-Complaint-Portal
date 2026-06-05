const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { signUserToken } = require('../utils/jwtToken');
const { sendEmail } = require('../config/email');
const { getClientUrl } = require('../config/env');

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    studentId: user.studentId,
    role: user.role,
  };
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    const { email, password, name, studentId, role } = req.body;
    if (role === 'admin') {
      return res.status(403).json({ message: 'Cannot register as admin via this endpoint' });
    }
    const user = await User.create({
      email,
      password,
      name,
      studentId: studentId || undefined,
      role: 'student',
    });
    const token = signUserToken(user);
    res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    const { identifier, email, studentId, password } = req.body;
    const id = identifier || email || studentId;
    if (!id || !password) {
      return res.status(400).json({ message: 'Identifier and password required' });
    }
    const user = await User.findOne({
      $or: [{ email: id.toLowerCase().trim() }, { studentId: id.trim() }],
    }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Use the admin sign-in page' });
    }
    const token = signUserToken(user);
    res.json({
      token,
      user: publicUser(user),
    });
  } catch (e) {
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    const email = String(req.body.email).toLowerCase().trim();
    const user = await User.findOne({ email });
    const message = 'If that email exists, a reset link has been sent.';
    if (!user) {
      return res.json({ message });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const link = `${getClientUrl()}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your SCP password',
      text: `Reset your password: ${link}\nThis link expires in 1 hour.`,
      html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
    });
    res.json({ message });
  } catch (e) {
    next(e);
  }
}

async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    const { token, password, email } = req.body;
    const hash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires +password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password updated. You can sign in now.' });
  } catch (e) {
    next(e);
  }
}

module.exports = { register, login, me, forgotPassword, resetPassword };
