const jwt = require('jsonwebtoken');
const { getJwtSecret, getJwtExpiresIn } = require('../config/env');

function signUserToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() }
  );
}

module.exports = { signUserToken };
