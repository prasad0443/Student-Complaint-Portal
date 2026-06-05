require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const { validateEnv } = require('./config/env');
const { setupSocketRedis, closeRedis } = require('./config/redis');
const { buildApp, buildServer, buildIo } = require('./app');

validateEnv();

const app = buildApp();
const server = buildServer(app);
const io = buildIo(server);
app.set('io', io);

const PORT = process.env.PORT || 5000;

function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => {
    io.close();
    Promise.allSettled([closeRedis(), mongoose.connection.close(false)]).then(() => {
      console.log('Shutdown complete');
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  await connectDB();
  await setupSocketRedis(io);
  server.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
