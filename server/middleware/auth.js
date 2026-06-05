const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/env');

function protect(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/** Ensures JWT role matches DB (mitigates stale tokens after role changes / tampering). */
async function verifyTokenMatchesUser(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('role');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (user.role !== req.userRole) {
      return res.status(403).json({ message: 'Session invalid — please sign in again' });
    }
    req.userRole = user.role;
    next();
  } catch (e) {
    next(e);
  }
}

async function attachUser(req, res, next) {
  if (!req.userId) return next();
  try {
    req.user = await User.findById(req.userId).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (e) {
    next(e);
  }
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/** Admin dashboard and complaint management (not students). */
function restrictToStaff(req, res, next) {
  if (!req.userRole || !['admin', 'super_admin'].includes(req.userRole)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

module.exports = {
  protect,
  attachUser,
  restrictTo,
  restrictToStaff,
  verifyTokenMatchesUser,
};
