const Complaint = require('../models/Complaint');

async function summary(req, res, next) {
  try {
    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const pendingStatuses = ['submitted', 'under_review', 'in_progress'];
    const pending = await Complaint.countDocuments({ status: { $in: pendingStatuses } });
    const resolved = await Complaint.countDocuments({ status: 'resolved' });
    const rejected = await Complaint.countDocuments({ status: 'rejected' });

    const monthly = await Complaint.aggregate([
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
      { $limit: 24 },
    ]);

    res.json({
      byCategory: byCategory.map((x) => ({ category: x._id, count: x.count })),
      byStatus: byStatus.map((x) => ({ status: x._id, count: x.count })),
      pendingVsResolved: {
        pending,
        resolved,
        rejected,
      },
      monthly: monthly.map((x) => ({
        year: x._id.y,
        month: x._id.m,
        count: x.count,
        label: `${x._id.y}-${String(x._id.m).padStart(2, '0')}`,
      })),
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { summary };
