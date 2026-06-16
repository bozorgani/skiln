const fs = require('fs/promises');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

const storageDriver = () => (process.env.STORAGE_DRIVER || 'local').toLowerCase();

let s3Client = null;

const getPublicBaseUrl = () => {
  if (process.env.STORAGE_PUBLIC_URL) return process.env.STORAGE_PUBLIC_URL.replace(/\/$/, '');
  if (process.env.BACKEND_PUBLIC_URL) return process.env.BACKEND_PUBLIC_URL.replace(/\/$/, '');
  return '';
};

const getS3Client = () => {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
  });

  return s3Client;
};

const buildLocalUrl = (key) => `/uploads/${key}`.replace(/\/+/g, '/');

const buildS3Url = (key) => {
  const baseUrl = getPublicBaseUrl();
  if (baseUrl) return `${baseUrl}/${key}`;

  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
  if (endpoint && bucket) return `${endpoint}/${bucket}/${key}`;

  return key;
};

const uploadLocal = async ({ key, buffer }) => {
  const fullPath = path.join(UPLOAD_ROOT, key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return {
    driver: 'local',
    key,
    url: buildLocalUrl(key),
    path: fullPath,
  };
};

const uploadS3 = async ({ key, buffer, contentType }) => {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error('S3_BUCKET is required when STORAGE_DRIVER=s3');

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: process.env.S3_ACL || undefined,
    CacheControl: process.env.S3_CACHE_CONTROL || 'public, max-age=31536000, immutable',
  }));

  return {
    driver: 's3',
    key,
    url: buildS3Url(key),
  };
};

const uploadObject = async ({ folder, filename, buffer, contentType }) => {
  const key = `${folder.replace(/^\/+|\/+$/g, '')}/${filename}`;

  if (storageDriver() === 's3') {
    return uploadS3({ key, buffer, contentType });
  }

  return uploadLocal({ key, buffer });
};

const deleteObject = async (key) => {
  if (!key) return;

  if (storageDriver() === 's3') {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) return;
    await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }

  await fs.rm(path.join(UPLOAD_ROOT, key), { force: true });
};

module.exports = {
  uploadObject,
  deleteObject,
  storageDriver,
};
