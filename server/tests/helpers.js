const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { buildApp } = require('../app');
const { connectDB } = require('../config/db');
const User = require('../models/User');

let mongod;
let app;

async function setupTestEnv() {
  if (app) return app;

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.STORAGE_PROVIDER = 'local';
  delete process.env.REDIS_URL;
  delete process.env.S3_BUCKET;

  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await connectDB();
  app = buildApp();
  return app;
}

async function teardownTestEnv() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  app = null;
  mongod = null;
}

async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

async function createStudent(overrides = {}) {
  return User.create({
    email: 'student@test.edu',
    password: 'student123',
    name: 'Test Student',
    studentId: 'STU9999001',
    role: 'student',
    ...overrides,
  });
}

async function createAdmin(overrides = {}) {
  return User.create({
    email: 'admin@test.edu',
    password: 'admin123',
    name: 'Test Admin',
    role: 'admin',
    ...overrides,
  });
}

async function loginStudent(request, app, identifier = 'student@test.edu') {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ identifier, password: 'student123' });
  return res.body.token;
}

async function loginAdmin(request, app) {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ email: 'admin@test.edu', password: 'admin123' });
  return res.body.token;
}

module.exports = {
  setupTestEnv,
  teardownTestEnv,
  clearCollections,
  createStudent,
  createAdmin,
  loginStudent,
  loginAdmin,
};
