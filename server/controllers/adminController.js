const { validationResult } = require('express-validator');
const User = require('../models/User');
const { signUserToken } = require('../utils/jwtToken');

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    studentId: user.studentId,
    role: user.role,
  };
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Use the student sign-in page' });
    }
    const token = signUserToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    next(e);
  }
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    const email = String(req.body.email).toLowerCase().trim();
    const { password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = await User.create({
      email,
      password,
      name: String(name).trim(),
      role: 'admin',
    });
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
}

module.exports = { login, register, me, publicUser };
