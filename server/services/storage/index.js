const local = require('./local');
const s3 = require('./s3');

function getProvider() {
  const p = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  return p === 's3' ? 's3' : 'local';
}

function getAdapter() {
  return getProvider() === 's3' ? s3 : local;
}

async function storeFiles(files) {
  return getAdapter().storeFiles(files);
}

async function deleteAttachment(attachment) {
  return getAdapter().deleteAttachment(attachment);
}

async function getUrl(attachment) {
  return getAdapter().getUrl(attachment);
}

module.exports = {
  getProvider,
  storeFiles,
  deleteAttachment,
  getUrl,
};
