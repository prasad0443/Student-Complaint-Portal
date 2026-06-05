const storage = require('../services/storage');

async function enrichAttachments(attachments) {
  if (!attachments?.length) return [];
  return Promise.all(
    attachments.map(async (a) => ({
      ...a,
      url: await storage.getUrl(a),
    }))
  );
}

async function enrichComplaint(complaint) {
  if (!complaint) return complaint;
  return {
    ...complaint,
    attachments: await enrichAttachments(complaint.attachments),
  };
}

async function enrichComplaints(complaints) {
  return Promise.all((complaints || []).map((c) => enrichComplaint(c)));
}

module.exports = { enrichAttachments, enrichComplaint, enrichComplaints };
