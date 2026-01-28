const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
accessKeyId: process.env.AWS_ACCESS_KEY_ID,
secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

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
console.log(`✅ File uploaded to S3: ${result.Location}`);
return result;
} catch (error) {
console.error('❌ S3 upload error:', error);
throw new Error(`Failed to upload to S3: ${error.message}`);
}
};

const getSignedUrl = (key) => {
try {
const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 3600 // URL expires in 1 hour
};

const url = s3.getSignedUrl('getObject', params);
return url;
} catch (error) {
console.error('❌ Error generating signed URL:', error);
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
console.log(`✅ File deleted from S3: ${key}`);
} catch (error) {
console.error('❌ S3 delete error:', error);
throw new Error(`Failed to delete from S3: ${error.message}`);
}
};

module.exports = {
uploadToS3,
getSignedUrl,
deleteFromS3
};