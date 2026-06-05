const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { isProd, getJwtSecret, getClientUrl, shouldTrustProxy } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/security');
const { protect, verifyTokenMatchesUser } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { isRedisConnected } = require('./config/redis');

function buildApp() {
  const app = express();
  const clientUrl = getClientUrl();

  if (shouldTrustProxy()) {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProd ? undefined : false,
    })
  );
  app.use(
    cors({
      origin: clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', apiLimiter);
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.get('/api/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({
      ok: dbReady,
      db: dbReady ? 'connected' : 'disconnected',
      redis: isRedisConnected() ? 'connected' : process.env.REDIS_URL ? 'disconnected' : 'disabled',
      storage: process.env.STORAGE_PROVIDER || 'local',
      uptime: Math.floor(process.uptime()),
      env: process.env.NODE_ENV || 'development',
    });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/admin', authLimiter, adminRoutes);
  app.use('/api/files', protect, verifyTokenMatchesUser, fileRoutes);
  app.use('/api/complaints', protect, verifyTokenMatchesUser, complaintRoutes);
  app.use('/api/analytics', protect, verifyTokenMatchesUser, analyticsRoutes);

  app.use(errorHandler);

  if (isProd) {
    const clientDist = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}

function buildServer(app) {
  return http.createServer(app);
}

function buildIo(server) {
  const clientUrl = getClientUrl();
  const io = new Server(server, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, getJwtSecret());
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
      socket.join('role:admin');
    }
  });

  return io;
}

module.exports = { buildApp, buildServer, buildIo };
