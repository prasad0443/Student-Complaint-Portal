const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let client;

function getClient() {
  if (client) return client;
  client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  });
  return client;
}

function getBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error('S3_BUCKET is required when STORAGE_PROVIDER=s3');
  return bucket;
}

function safeName(original) {
  const ext = path.extname(original) || '';
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${Date.now()}-${base}${ext}`;
}

async function storeFiles(files) {
  const bucket = getBucket();
  const s3 = getClient();
  const out = [];
  for (const f of files || []) {
    const key = `complaints/${safeName(f.originalname)}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: f.buffer,
        ContentType: f.mimetype,
      })
    );
    out.push({
      filename: path.basename(key),
      originalName: f.originalname,
      mimeType: f.mimetype,
      storageKey: key,
      path: `/api/files/${encodeURIComponent(key)}`,
    });
  }
  return out;
}

async function deleteAttachment(attachment) {
  if (!attachment?.storageKey) return;
  const s3 = getClient();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: attachment.storageKey,
    })
  );
}

async function getUrl(attachment) {
  if (!attachment?.storageKey) return attachment?.path || null;
  const s3 = getClient();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: attachment.storageKey,
      ResponseContentDisposition: `inline; filename="${attachment.originalName || 'file'}"`,
    }),
    { expiresIn: 3600 }
  );
}

async function streamObject(key) {
  const s3 = getClient();
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
  return res;
}

module.exports = { storeFiles, deleteAttachment, getUrl, streamObject };
