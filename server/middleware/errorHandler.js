const { isProd } = require('../config/env');

function errorHandler(err, _req, res, _next) {
  if (!isProd) {
    console.error(err);
  } else {
    console.error(err.message || err);
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate value' });
  }
  if (err.message === 'Only images and PDF files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  const status = err.status || 500;
  const message = status === 500 && isProd ? 'Server error' : err.message || 'Server error';
  res.status(status).json({ message });
}

module.exports = { errorHandler };
