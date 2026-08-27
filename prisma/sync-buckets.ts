import { S3Client, CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

async function main() {
  // Sync all objects from knotted-courses to knotted-course
  const res = await client.send(new ListObjectsV2Command({ Bucket: "knotted-courses" }));
  for (const item of res.Contents || []) {
    if (item.Key) {
      console.log(`Syncing ${item.Key} to knotted-course...`);
      await client.send(
        new CopyObjectCommand({
          Bucket: "knotted-course",
          CopySource: `knotted-courses/${item.Key}`,
          Key: item.Key,
        })
      );
    }
  }
  console.log("✅ Synced all objects across both buckets!");
}

main().catch(console.error);
