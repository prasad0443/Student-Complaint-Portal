const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { nextComplaintId } = require('../utils/complaintId');
const { sendEmail } = require('../config/email');
const { TIMELINE_STATUSES } = require('../models/Complaint');
const { maskAnonymousComplaint, maskAnonymousComplaints } = require('../utils/complaintResponse');
const storage = require('../services/storage');
const { enrichComplaint } = require('../utils/attachments');

function getIo(req) {
  return req.app.get('io');
}

function emitComplaint(io, complaint, event = 'complaint:updated') {
  if (!io) return;
  const sid =
    complaint.student && complaint.student._id
      ? complaint.student._id.toString()
      : complaint.student
        ? complaint.student.toString()
        : null;
  const plain = typeof complaint.toObject === 'function' ? complaint.toObject() : { ...complaint };
  const payloadComplaint = maskAnonymousComplaint(plain);
  const complaintId = payloadComplaint.complaintId || payloadComplaint._id;
  if (sid) {
    io.to(`user:${sid}`).emit(event, { complaintId, complaint: payloadComplaint });
  }
  io.to('role:admin').emit(event, { complaintId, complaint: payloadComplaint });
}

async function notifySubmitted(complaint, studentUser) {
  if (!studentUser?.email) return;
  await sendEmail({
    to: studentUser.email,
    subject: `[${complaint.complaintId}] Complaint received`,
    text: `Your complaint "${complaint.title}" has been submitted. Current status: ${complaint.status}.`,
    html: `<p>Your complaint <strong>${complaint.complaintId}</strong> has been submitted.</p><p><strong>${complaint.title}</strong></p><p>Status: ${complaint.status}</p>`,
  });
}

async function notifyStatusUpdate(complaint, studentUser) {
  if (!studentUser?.email) return;
  await sendEmail({
    to: studentUser.email,
    subject: `[${complaint.complaintId}] Status updated: ${complaint.status}`,
    text: `Your complaint status is now: ${complaint.status}.`,
    html: `<p>Complaint <strong>${complaint.complaintId}</strong> status is now <strong>${complaint.status}</strong>.</p>`,
  });
}

function isStaff(role) {
  return role === 'admin' || role === 'super_admin';
}

function buildListQuery(req, options = {}) {
  const { category, priority, status, from, to, search } = req.query;
  const q = {};
  const asAdmin = options.asAdmin || isStaff(req.userRole);
  if (!asAdmin && req.userRole === 'student') {
    q.student = new mongoose.Types.ObjectId(req.userId);
  }
  if (category) q.category = category;
  if (priority) q.priority = priority;
  if (status) q.status = status;
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }
  if (search && String(search).trim()) {
    q.$text = { $search: String(search).trim() };
  }
  return q;
}

function parseBool(v) {
  return v === true || v === 'true' || v === '1';
}

async function summary(req, res, next) {
  try {
    const q = buildListQuery(req);
    const [total, byStatus] = await Promise.all([
      Complaint.countDocuments(q),
      Complaint.aggregate([{ $match: q }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const statusCounts = {};
    for (const row of byStatus) statusCounts[row._id] = row.count;
    const pendingStatuses = ['submitted', 'under_review', 'in_progress'];
    const pending = pendingStatuses.reduce((n, s) => n + (statusCounts[s] || 0), 0);
    res.json({
      total,
      pending,
      resolved: statusCounts.resolved || 0,
      rejected: statusCounts.rejected || 0,
      byStatus: statusCounts,
    });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const q = buildListQuery(req);
    const hasSearch = Boolean(req.query.search && String(req.query.search).trim());
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Complaint.find(q)
        .sort(hasSearch ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('student', 'name email studentId')
        .populate('adminNotes.by', 'name email')
        .populate('timeline.by', 'name email')
        .lean(),
      Complaint.countDocuments(q),
    ]);
    const masked = maskAnonymousComplaints(items);
    res.json({ data: masked, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
}

async function getOne(req, res, next) {
  try {
    const c = await Complaint.findById(req.params.id)
      .populate('student', 'name email studentId')
      .populate('adminNotes.by', 'name email')
      .populate('timeline.by', 'name email')
      .lean();
    if (!c) return res.status(404).json({ message: 'Complaint not found' });

    const ownerId = c.student?._id ? c.student._id.toString() : c.student?.toString();
    if (req.userRole === 'student' && ownerId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const viewerIsOwner = req.userRole === 'student' && ownerId === req.userId;
    let out = { ...c };
    if (req.userRole === 'student') {
      out.viewerIsOwner = viewerIsOwner;
    }
    out = maskAnonymousComplaint(out);
    out = await enrichComplaint(out);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    const { title, category, description, isAnonymous, anonymous } = req.body;
    const isAnon = parseBool(isAnonymous) || parseBool(anonymous);
    const complaintId = await nextComplaintId();
    const attachments = await storage.storeFiles(req.files || []);
    const studentUser = await User.findById(req.userId).select('studentId');
    const campusStudentId = isAnon ? null : studentUser?.studentId || null;
    const complaint = await Complaint.create({
      complaintId,
      title,
      category,
      description,
      isAnonymous: isAnon,
      studentId: campusStudentId,
      student: req.userId,
      attachments,
      status: 'submitted',
      timeline: [{ status: 'submitted', at: new Date(), note: 'Complaint submitted' }],
    });
    const populated = await Complaint.findById(complaint._id)
      .populate('student', 'name email studentId')
      .lean();
    const studentForEmail = await User.findById(req.userId);
    await notifySubmitted(populated, studentForEmail);
    emitComplaint(getIo(req), populated, 'complaint:created');
    const out = await enrichComplaint(maskAnonymousComplaint(populated));
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    if (!isStaff(req.userRole)) {
      return res.status(403).json({ message: 'Only admins can update complaints' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const { status, priority, department, adminNote } = req.body;
    const prevStatus = complaint.status;

    if (priority !== undefined) complaint.priority = priority;
    if (department !== undefined) complaint.department = String(department).trim();

    if (adminNote && String(adminNote).trim()) {
      complaint.adminNotes.push({ text: String(adminNote).trim(), by: req.userId });
    }

    if (status && TIMELINE_STATUSES.includes(status) && status !== complaint.status) {
      complaint.status = status;
      complaint.timeline.push({
        status,
        at: new Date(),
        note: req.body.timelineNote || `Status changed to ${status}`,
        by: req.userId,
      });
    }

    await complaint.save();
    const populated = await Complaint.findById(complaint._id)
      .populate('student', 'name email studentId')
      .populate('adminNotes.by', 'name email')
      .populate('timeline.by', 'name email')
      .lean();

    if (status && status !== prevStatus) {
      const studentUser = await User.findById(complaint.student);
      await notifyStatusUpdate(populated, studentUser);
    }
    emitComplaint(getIo(req), populated, 'complaint:updated');
    const out = await enrichComplaint(maskAnonymousComplaint(populated));
    res.json(out);
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (isStaff(req.userRole)) {
      for (const a of complaint.attachments || []) {
        await storage.deleteAttachment(a);
      }
      await complaint.deleteOne();
      getIo(req)?.to('role:admin').emit('complaint:deleted', { id: req.params.id });
      return res.status(204).send();
    }
    if (complaint.student.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (complaint.status !== 'submitted') {
      return res.status(400).json({ message: 'You can only delete complaints that are still submitted' });
    }
    for (const a of complaint.attachments || []) {
      await storage.deleteAttachment(a);
    }
    await complaint.deleteOne();
    emitComplaint(getIo(req), { ...complaint.toObject(), student: req.userId }, 'complaint:deleted');
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

async function exportPdf(req, res, next) {
  try {
    if (!isStaff(req.userRole)) {
      return res.status(403).json({ message: 'Admin only' });
    }
    const q = buildListQuery(req, { asAdmin: true });
    const items = await Complaint.find(q).sort({ createdAt: -1 }).limit(500).lean();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints-report.pdf');
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(18).text('Student Complaint Portal — Report', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
    doc.moveDown();
    items.forEach((c, i) => {
      if (i > 0) doc.moveDown(0.5);
      doc.fontSize(11).text(`${c.complaintId} — ${c.title}`, { continued: false });
      doc.fontSize(9).text(`Category: ${c.category} | Status: ${c.status} | Priority: ${c.priority}`);
      doc.text(`Created: ${c.createdAt}`);
      doc.moveDown(0.3);
    });
    doc.end();
  } catch (e) {
    next(e);
  }
}

module.exports = {
  summary,
  list,
  getOne,
  create,
  update,
  remove,
  exportPdf,
};
