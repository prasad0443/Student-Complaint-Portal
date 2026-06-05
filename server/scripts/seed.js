require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Counter = require('../models/Counter');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_complaint_portal';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Seeding...');

  await Promise.all([
    User.deleteMany({}),
    Complaint.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  const superUser = await User.create({
    email: 'super@scp.edu',
    password: 'super123',
    name: 'Super Admin',
    role: 'super_admin',
  });

  const admin = await User.create({
    email: 'admin@scp.edu',
    password: 'admin123',
    name: 'Portal Admin',
    role: 'admin',
  });

  const s1 = await User.create({
    studentId: 'STU2026001',
    email: 'alice@student.edu',
    password: 'student123',
    name: 'Alice Johnson',
    role: 'student',
  });

  const s2 = await User.create({
    studentId: 'STU2026002',
    email: 'bob@student.edu',
    password: 'student123',
    name: 'Bob Smith',
    role: 'student',
  });

  const c1 = await Complaint.create({
    complaintId: 'SCP-2026-0001',
    title: 'Hostel Wi-Fi unstable in Block B',
    category: 'hostel',
    description: 'Connection drops every evening between 8–11 PM. Affects studies.',
    isAnonymous: false,
    studentId: s1.studentId,
    student: s1._id,
    status: 'under_review',
    priority: 'high',
    department: 'Hostel & IT',
    timeline: [
      { status: 'submitted', at: new Date(Date.now() - 5 * 86400000), note: 'Complaint submitted' },
      { status: 'under_review', at: new Date(Date.now() - 3 * 86400000), note: 'Assigned to facilities' },
    ],
    adminNotes: [{ text: 'IT team notified', by: admin._id, at: new Date() }],
  });

  await Complaint.create({
    complaintId: 'SCP-2026-0002',
    title: 'Course registration system error',
    category: 'IT',
    description: 'Getting 500 error when adding elective CS-401.',
    isAnonymous: true,
    studentId: null,
    student: s2._id,
    status: 'in_progress',
    priority: 'urgent',
    department: 'IT Helpdesk',
    timeline: [
      { status: 'submitted', at: new Date(Date.now() - 2 * 86400000), note: 'Complaint submitted' },
      { status: 'under_review', at: new Date(Date.now() - 1.5 * 86400000), note: 'Ticket opened' },
      { status: 'in_progress', at: new Date(Date.now() - 1 * 86400000), note: 'Developer investigating' },
    ],
  });

  await Complaint.create({
    complaintId: 'SCP-2026-0003',
    title: 'Late fee waiver request',
    category: 'fees',
    description: 'Medical emergency last month — requesting waiver documentation review.',
    isAnonymous: false,
    studentId: s1.studentId,
    student: s1._id,
    status: 'resolved',
    priority: 'medium',
    department: 'Accounts',
    timeline: [
      { status: 'submitted', at: new Date(Date.now() - 20 * 86400000), note: 'Complaint submitted' },
      { status: 'under_review', at: new Date(Date.now() - 18 * 86400000), note: 'Docs received' },
      { status: 'in_progress', at: new Date(Date.now() - 15 * 86400000), note: 'Committee review' },
      { status: 'resolved', at: new Date(Date.now() - 10 * 86400000), note: 'Partial waiver approved' },
    ],
  });

  await Counter.create({ key: 'complaint-2026', seq: 3 });

  console.log('Done.');
  console.log('Super:    super@scp.edu / super123  (creates admins via /api/admin/register)');
  console.log('Admin:    admin@scp.edu / admin123');
  console.log('Student:  alice@student.edu / student123  (STU2026001)');
  console.log('Student:  bob@student.edu / student123    (STU2026002)');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
