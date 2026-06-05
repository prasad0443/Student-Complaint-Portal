const mongoose = require('mongoose');

const TIMELINE_STATUSES = ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'];

const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: TIMELINE_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: '' },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimeType: String,
    storageKey: String,
    path: String,
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: {
      type: String,
      enum: ['academics', 'hostel', 'IT', 'fees', 'others'],
      required: true,
    },
    description: { type: String, required: true, maxlength: 10000 },
    isAnonymous: { type: Boolean, default: false },
    /**
     * Denormalized campus student ID (same as User.studentId) for DB queries/linking.
     * Cleared when isAnonymous; stripped from API responses (use populated `student` when not anonymous).
     */
    studentId: { type: String, trim: true, default: null },
    /** @deprecated Prefer `studentId`; retained so older documents still load under strict schema. */
    submitterStudentId: { type: String, trim: true, default: null },
    attachments: [attachmentSchema],
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: TIMELINE_STATUSES,
      default: 'submitted',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    department: { type: String, trim: true, default: '' },
    adminNotes: [
      {
        text: { type: String, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
    timeline: [timelineEntrySchema],
  },
  { timestamps: true }
);

complaintSchema.index({ category: 1, status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ student: 1, createdAt: -1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ title: 'text', description: 'text', complaintId: 'text' });

module.exports = mongoose.model('Complaint', complaintSchema);
module.exports.TIMELINE_STATUSES = TIMELINE_STATUSES;
