const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

const storageDriver = () => (process.env.STORAGE_DRIVER || 'local').toLowerCase();

let s3Client = null;

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

const buildProxyUrl = (key) => `/uploads/${key}`.replace(/\/+/g, '/');

const uploadLocal = async ({ key, buffer }) => {
  const fullPath = path.join(UPLOAD_ROOT, key);
  await fsPromises.mkdir(path.dirname(fullPath), { recursive: true });
  await fsPromises.writeFile(fullPath, buffer);
  return {
    driver: 'local',
    key,
    url: buildProxyUrl(key),
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
    CacheControl: process.env.S3_CACHE_CONTROL || 'private, max-age=0, no-cache',
  }));

  return {
    driver: 's3',
    key,
    url: buildProxyUrl(key),
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

  await fsPromises.rm(path.join(UPLOAD_ROOT, key), { force: true });
};

const getObjectHead = async (key) => {
  if (storageDriver() === 's3') {
    const bucket = process.env.S3_BUCKET;
    const response = await getS3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return {
      contentLength: Number(response.ContentLength || 0),
      contentType: response.ContentType,
      etag: response.ETag,
      lastModified: response.LastModified,
    };
  }

  const fullPath = path.join(UPLOAD_ROOT, key);
  const stat = await fsPromises.stat(fullPath);
  return {
    contentLength: stat.size,
    lastModified: stat.mtime,
    path: fullPath,
  };
};

const getObjectStream = async (key, rangeHeader) => {
  if (storageDriver() === 's3') {
    const bucket = process.env.S3_BUCKET;
    const response = await getS3Client().send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: rangeHeader || undefined,
    }));
    return response.Body;
  }

  const fullPath = path.join(UPLOAD_ROOT, key);
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d+)?$/.exec(rangeHeader);
    if (match) {
      return fs.createReadStream(fullPath, {
        start: Number.parseInt(match[1], 10),
        end: match[2] ? Number.parseInt(match[2], 10) : undefined,
      });
    }
  }

  return fs.createReadStream(fullPath);
};

module.exports = {
  uploadObject,
  deleteObject,
  getObjectHead,
  getObjectStream,
  storageDriver,
};
