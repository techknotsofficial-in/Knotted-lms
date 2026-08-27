import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedPlaybackUrl } from "../src/lib/storage";

const accountId = "2c451917461da7dbdc0e30d14c2ded2b";
const accessKeyId = "1e7a2f1d7e1706e7cec56a0abc377aef";
const secretAccessKey = "c822e6025ce3f93768831d4d9620bc7e2ca1a8a7df720359dd6fbe8fc341e4e6";
const bucketName = "knotted-courses";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

async function main() {
  const res = await client.send(new ListObjectsV2Command({ Bucket: bucketName }));
  console.log("Files in knotted-courses:");
  for (const item of res.Contents || []) {
    console.log(`- ${item.Key} (${item.Size} bytes)`);
    if (item.Key?.endsWith(".mp4")) {
      const signedUrl = await getSignedPlaybackUrl(item.Key);
      console.log(`  🔗 Signed Playback URL: ${signedUrl}\n`);
    }
  }
}

main().catch(console.error);
