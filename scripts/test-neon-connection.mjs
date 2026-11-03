import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('--- Testing Neon Postgres ---');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');
  const sql = neon(process.env.DATABASE_URL);
  const dbResult = await sql`SELECT version(), current_database(), current_user, NOW() as current_time;`;
  console.log('Postgres Query Result:', dbResult);

  console.log('\n--- Testing Neon Object Storage ---');
  console.log('Endpoint:', process.env.AWS_ENDPOINT_URL_S3);
  console.log('Region:', process.env.AWS_REGION);
  console.log('Access Key:', process.env.AWS_ACCESS_KEY_ID ? 'Loaded' : 'Missing');

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true, // required: Neon uses path-style addressing
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const bucket = 'assets';
  const testKey = `test/hello-neon-${Date.now()}.txt`;
  const testContent = 'Hello Neon Object Storage from Cakexperiment!';

  console.log(`Uploading test file to bucket "${bucket}" with key "${testKey}"...`);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    })
  );
  console.log('Upload successful!');

  console.log('Listing objects in bucket...');
  const listRes = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'test/',
    })
  );
  console.log('Objects found:', listRes.Contents?.map(c => c.Key));

  console.log('Reading object back...');
  const getRes = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: testKey,
    })
  );
  const downloadedText = await getRes.Body.transformToString();
  console.log('Downloaded Content:', downloadedText);

  console.log('Cleaning up test object...');
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: testKey,
    })
  );
  console.log('Cleanup successful!');
  console.log('\n=== ALL NEON SERVICES VERIFIED END-TO-END! ===');
}

main().catch(err => {
  console.error('Error during Neon verification:', err);
  process.exit(1);
});

