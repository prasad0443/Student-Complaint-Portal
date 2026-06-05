const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

function ensureDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

async function storeFiles(files) {
  ensureDir();
  return (files || []).map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    mimeType: f.mimetype,
    storageKey: f.filename,
    path: `/uploads/${f.filename}`,
  }));
}

async function deleteAttachment(attachment) {
  if (!attachment?.storageKey && !attachment?.filename) return;
  const key = attachment.storageKey || attachment.filename;
  const fp = path.join(uploadDir, key);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

async function getUrl(attachment) {
  const key = attachment.storageKey || attachment.filename;
  if (!key) return attachment.path || null;
  return attachment.path || `/uploads/${key}`;
}

module.exports = { storeFiles, deleteAttachment, getUrl, uploadDir };
