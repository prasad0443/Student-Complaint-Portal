/**
 * Normalize anonymous flag (supports legacy `anonymous` field in DB).
 * @param {object} doc
 * @returns {boolean}
 */
function complaintIsAnonymous(doc) {
  if (!doc) return false;
  return doc.isAnonymous === true || doc.anonymous === true;
}

/** Internal-only denormalized fields; identity is exposed via populated `student` when allowed. */
function stripInternalComplaintFields(complaint) {
  if (!complaint) return complaint;
  const o = { ...complaint };
  delete o.submitterStudentId; // legacy key if present in old documents
  delete o.studentId; // denormalized campus ID — never send on wire (avoid duplicate/leaks)
  delete o.anonymous;
  return o;
}

/**
 * Strip student identity from complaint payloads when submission is anonymous.
 * @param {object} complaint — plain object (e.g. lean())
 * @returns {object}
 */
function maskAnonymousComplaint(complaint) {
  if (!complaint) return complaint;
  const isAnon = complaintIsAnonymous(complaint);
  const base = stripInternalComplaintFields(complaint);
  base.isAnonymous = isAnon;
  if (!isAnon) return base;
  const { student, ...rest } = base;
  return { ...rest, isAnonymous: true, student: null };
}

function maskAnonymousComplaints(items) {
  return (items || []).map((c) => maskAnonymousComplaint(c));
}

module.exports = {
  complaintIsAnonymous,
  maskAnonymousComplaint,
  maskAnonymousComplaints,
};
