const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

let pubClient;
let subClient;
let connected = false;

async function setupSocketRedis(io) {
  const url = process.env.REDIS_URL;
  if (!url) return false;

  pubClient = createClient({ url });
  subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('Redis pub error:', err.message));
  subClient.on('error', (err) => console.error('Redis sub error:', err.message));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  connected = true;
  console.log('Socket.io Redis adapter connected');
  return true;
}

function isRedisConnected() {
  return connected;
}

async function closeRedis() {
  if (!pubClient) return;
  await Promise.allSettled([pubClient.quit(), subClient?.quit()]);
  connected = false;
}

module.exports = { setupSocketRedis, isRedisConnected, closeRedis };
