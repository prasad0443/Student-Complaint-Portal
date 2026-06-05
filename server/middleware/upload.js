const path = require('path');
const multer = require('multer');
const storageService = require('../services/storage');
const { uploadDir } = require('../services/storage/local');

const isS3 = storageService.getProvider() === 's3';

if (!isS3) {
  const fs = require('fs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

const diskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const storage = isS3 ? multer.memoryStorage() : diskStorage;

function fileFilter(_req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp|pdf/i.test(path.extname(file.originalname));
  const mimeOk = /^image\/|application\/pdf$/i.test(file.mimetype);
  if (allowed && mimeOk) return cb(null, true);
  cb(new Error('Only images and PDF files are allowed'));
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter,
});

module.exports = { upload, uploadDir };
