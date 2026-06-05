const Counter = require('../models/Counter');

async function nextComplaintId() {
  const year = new Date().getFullYear();
  const key = `complaint-${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const n = String(counter.seq).padStart(4, '0');
  return `SCP-${year}-${n}`;
}

module.exports = { nextComplaintId };
