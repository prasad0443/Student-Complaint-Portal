const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const crypto = require('crypto');
const User = require('../models/User');
const {
  setupTestEnv,
  teardownTestEnv,
  clearCollections,
  createStudent,
  createAdmin,
  loginStudent,
  loginAdmin,
} = require('./helpers');

let app;

before(async () => {
  app = await setupTestEnv();
});

after(async () => {
  await teardownTestEnv();
});

beforeEach(async () => {
  await clearCollections();
});

test('health returns ok when db connected', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.db, 'connected');
});

test('student can register and login', async () => {
  const reg = await request(app).post('/api/auth/register').send({
    email: 'new@test.edu',
    password: 'secret12',
    name: 'New User',
    studentId: 'STU100',
  });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.token);
  assert.equal(reg.body.user.role, 'student');

  const login = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'new@test.edu', password: 'secret12' });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
});

test('student can create and list complaints', async () => {
  await createStudent();
  const token = await loginStudent(request, app);

  const created = await request(app)
    .post('/api/complaints')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Broken projector')
    .field('category', 'IT')
    .field('description', 'Room 101 projector not working');

  assert.equal(created.status, 201);
  assert.match(created.body.complaintId, /^SCP-\d{4}-\d{4}$/);

  const list = await request(app)
    .get('/api/complaints')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(list.status, 200);
  assert.equal(list.body.total, 1);
  assert.equal(list.body.data[0].title, 'Broken projector');
});

test('admin can update complaint status', async () => {
  const student = await createStudent();
  await createAdmin();
  const studentToken = await loginStudent(request, app);
  const adminToken = await loginAdmin(request, app);

  const created = await request(app)
    .post('/api/complaints')
    .set('Authorization', `Bearer ${studentToken}`)
    .field('title', 'Fee issue')
    .field('category', 'fees')
    .field('description', 'Incorrect charge on statement');

  const updated = await request(app)
    .put(`/api/complaints/${created.body._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'under_review', timelineNote: 'Reviewing with finance' });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.status, 'under_review');
  assert.ok(updated.body.timeline.length >= 2);
});

test('password reset flow works', async () => {
  await createStudent({ email: 'reset@test.edu', studentId: 'STU200' });

  const forgot = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'reset@test.edu' });
  assert.equal(forgot.status, 200);

  const user = await User.findOne({ email: 'reset@test.edu' })
    .select('+resetPasswordToken +resetPasswordExpires');
  assert.ok(user.resetPasswordToken);

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 3600000);
  await user.save();

  const reset = await request(app)
    .post('/api/auth/reset-password')
    .send({ email: 'reset@test.edu', token: rawToken, password: 'newpass99' });
  assert.equal(reset.status, 200);

  const login = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'reset@test.edu', password: 'newpass99' });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
});

test('complaint stats summary returns counts', async () => {
  await createStudent();
  const token = await loginStudent(request, app);

  await request(app)
    .post('/api/complaints')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Test')
    .field('category', 'others')
    .field('description', 'Sample');

  const stats = await request(app)
    .get('/api/complaints/stats/summary')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(stats.status, 200);
  assert.equal(stats.body.total, 1);
  assert.equal(stats.body.pending, 1);
});
