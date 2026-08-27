import { getPresignedUploadUrl } from "../src/lib/storage";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

async function main() {
  const accountId = "2c451917461da7dbdc0e30d14c2ded2b";
  const accessKeyId = "1e7a2f1d7e1706e7cec56a0abc377aef";
  const secretAccessKey = "c822e6025ce3f93768831d4d9620bc7e2ca1a8a7df720359dd6fbe8fc341e4e6";
  const bucketName = "knotted-courses";

  // 1. Generate Presigned Upload URL
  const testKey = `test-uploads/verify-upload-${Date.now()}.txt`;
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl({
    fileKey: testKey,
    contentType: "text/plain",
  });

  console.log("Generated Presigned Upload URL:", uploadUrl);

  // 2. Perform HTTP PUT upload
  const testBody = "Hello from Knotted LMS to Cloudflare R2!";
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "text/plain",
    },
    body: testBody,
  });

  console.log(`Upload Response Status: ${res.status} ${res.statusText}`);

  // 3. Verify in Cloudflare R2 Bucket
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const list = await client.send(new ListObjectsV2Command({ Bucket: bucketName }));
  console.log("✅ Verified live files in Cloudflare R2 bucket:", list.Contents?.map(c => ({ key: c.Key, size: c.Size })));
}

main().catch(console.error);
