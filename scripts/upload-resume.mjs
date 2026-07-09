import COS from 'cos-nodejs-sdk-v5';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { dirname, resolve as pathResolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: pathResolve(__dirname, '..', '.env.local') });

const SECRET_ID = process.env.COS_SECRET_ID || '';
const SECRET_KEY = process.env.COS_SECRET_KEY || '';
const BUCKET = process.env.COS_BUCKET || 'web-resource-1372876299';
const REGION = process.env.COS_REGION || 'ap-guangzhou';

const pdfPath = process.argv[2];
const cosKey = process.argv[3];

if (!pdfPath || !cosKey) {
  console.error('Usage: node upload-resume.mjs <local-pdf-path> <cos-key>');
  process.exit(1);
}

if (!SECRET_ID || !SECRET_KEY) {
  console.error('Missing COS_SECRET_ID or COS_SECRET_KEY in environment');
  process.exit(1);
}

const cos = new COS({ SecretId: SECRET_ID, SecretKey: SECRET_KEY });
const fileBody = readFileSync(resolve(pdfPath));

console.log(`Uploading ${pdfPath} (${(fileBody.length / 1024 / 1024).toFixed(2)}MB) to cos://${BUCKET}/${cosKey} ...`);

cos.putObject({
  Bucket: BUCKET,
  Region: REGION,
  Key: cosKey,
  Body: fileBody,
  ContentDisposition: 'inline',
    ContentType: 'application/pdf',
}, (err, data) => {
  if (err) {
    console.error('Upload failed:', err);
    process.exit(1);
  }
  console.log('Upload success!');
  console.log(`URL: https://${BUCKET}.cos.${REGION}.myqcloud.com/${cosKey}`);
});
