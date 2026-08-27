import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const accountId = "2c451917461da7dbdc0e30d14c2ded2b";
const accessKeyId = "1e7a2f1d7e1706e7cec56a0abc377aef";
const secretAccessKey = "c822e6025ce3f93768831d4d9620bc7e2ca1a8a7df720359dd6fbe8fc341e4e6";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

async function setCors(bucket: string) {
  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "HEAD", "DELETE"],
              AllowedOrigins: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    console.log(`✅ CORS policy applied to '${bucket}'`);
  } catch (err) {
    console.error(`Failed to set CORS on '${bucket}':`, err);
  }
}

async function main() {
  await setCors("knotted-courses");
  await setCors("knotted-course");
}

main();
