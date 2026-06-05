const mongoose = require('mongoose');

async function migrateComplaintAnonymousField() {
  const col = mongoose.connection.collection('complaints');
  const r = await col.updateMany({ anonymous: { $exists: true } }, [
    { $set: { isAnonymous: '$anonymous' } },
    { $unset: ['anonymous'] },
  ]);
  if (r.modifiedCount > 0) {
    console.log(`Migrated ${r.modifiedCount} complaint(s): anonymous → isAnonymous`);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_complaint_portal';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  console.log('MongoDB connected');
  await migrateComplaintAnonymousField();
}

module.exports = { connectDB };
