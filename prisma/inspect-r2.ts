import { S3Client, ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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
  const { Buckets } = await client.send(new ListBucketsCommand({}));
  console.log("All Buckets in Account:", Buckets?.map(b => b.Name));

  for (const b of Buckets || []) {
    if (b.Name) {
      const res = await client.send(new ListObjectsV2Command({ Bucket: b.Name }));
      console.log(`\n📦 Bucket '${b.Name}' Contents:`, res.Contents?.map(c => ({ key: c.Key, size: c.Size, lastModified: c.LastModified })));
    }
  }
}

main().catch(console.error);
