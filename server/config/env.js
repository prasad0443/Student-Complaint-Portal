const isProd = process.env.NODE_ENV === 'production';

function requireEnv(name) {
  const value = process.env[name];
  if (!value && isProd) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateEnv() {
  requireEnv('MONGODB_URI');
  requireEnv('JWT_SECRET');
  if (isProd) {
    if (!process.env.CLIENT_URL && !process.env.RENDER_EXTERNAL_URL) {
      throw new Error('Missing required environment variable: CLIENT_URL (or deploy on Render for auto RENDER_EXTERNAL_URL)');
    }
    if ((process.env.STORAGE_PROVIDER || '').toLowerCase() === 's3') {
      requireEnv('S3_BUCKET');
      requireEnv('S3_ACCESS_KEY');
      requireEnv('S3_SECRET_KEY');
    }
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && isProd) {
    throw new Error('JWT_SECRET is required in production');
  }
  return secret || 'dev-secret-change-me';
}

function getClientUrl() {
  return process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
}

function shouldTrustProxy() {
  return process.env.TRUST_PROXY === 'true' || isProd || Boolean(process.env.RENDER);
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

module.exports = {
  isProd,
  validateEnv,
  getJwtSecret,
  getClientUrl,
  getJwtExpiresIn,
  shouldTrustProxy,
};
