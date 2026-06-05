const storage = require('../services/storage');

async function download(req, res, next) {
  try {
    if (storage.getProvider() !== 's3') {
      return res.status(404).json({ message: 'File not found' });
    }
    const key = decodeURIComponent(req.params.key);
    const s3 = require('../services/storage/s3');
    const obj = await s3.streamObject(key);
    if (obj.ContentType) res.setHeader('Content-Type', obj.ContentType);
    if (obj.ContentLength) res.setHeader('Content-Length', obj.ContentLength);
    obj.Body.pipe(res);
  } catch (e) {
    if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ message: 'File not found' });
    }
    next(e);
  }
}

module.exports = { download };
