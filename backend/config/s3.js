const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
accessKeyId: process.env.AWS_ACCESS_KEY_ID,
secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// Expiry durations by file type
const EXPIRY = {
  audio:   60 * 60,       // 1 hour  — audio streams need time to play
  avatar:  15 * 60,       // 15 mins — avatars are tiny, re-signed on every fetch
  default: 60 * 60,       // 1 hour  — fallback
};

// Detect what kind of file a key is so callers don't have to think about it
const resolveExpiry = (key) => {
    if (!key) return EXPIRY.default;
    if (key.startsWith('avatars/'))      return EXPIRY.avatar;
    if (key.startsWith('submissions/'))  return EXPIRY.audio;
    if (key.startsWith('tracks/'))       return EXPIRY.audio;
return EXPIRY.default;
};

const uploadToS3 = async (file, key) => {
const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private',
    Metadata: {
    originalName: file.originalname,
    uploadedAt: new Date().toISOString()
    }
};

try {
    const result = await s3.upload(params).promise();
    return result;
} catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
}
};

// expiresIn is optional — auto-detected from key prefix if omitted
const getSignedUrl = (key, expiresIn) => {
try {
    if (!key) return null;
    const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: expiresIn ?? resolveExpiry(key),
    };
    return s3.getSignedUrl('getObject', params);
} catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
}
};

const deleteFromS3 = async (key) => {
try {
    const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key
    };
    await s3.deleteObject(params).promise();
} catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
}
};

module.exports = { uploadToS3, getSignedUrl, deleteFromS3, EXPIRY };