import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * 100% Cloudflare R2 Storage Engine (Zero Egress Bandwidth Fees)
 * All media is uploaded directly to Cloudflare R2 endpoints using signed tokens.
 */
function getStorageConfig() {
  const accountId = process.env.R2_ACCOUNT_ID || "2c451917461da7dbdc0e30d14c2ded2b";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "1e7a2f1d7e1706e7cec56a0abc377aef";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "c822e6025ce3f93768831d4d9620bc7e2ca1a8a7df720359dd6fbe8fc341e4e6";
  const bucketName = process.env.R2_BUCKET_NAME || "knotted-courses";
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://pub-${accountId}.r2.dev`;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  return { client, bucketName, publicDomain };
}

export interface GeneratePresignedUrlParams {
  fileKey: string;
  contentType: string;
  expiresInSeconds?: number;
}

/**
 * Generate Direct-to-Cloudflare-R2 Presigned Upload URL (PUT)
 * Bypasses server bandwidth entirely with $0 egress fees.
 */
export async function getPresignedUploadUrl({
  fileKey,
  contentType,
  expiresInSeconds = 600, // 10 minutes validity
}: GeneratePresignedUrlParams) {
  const { client, bucketName, publicDomain } = getStorageConfig();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  const publicUrl = `${publicDomain.replace(/\/$/, "")}/${fileKey}`;

  return {
    uploadUrl,
    publicUrl,
    fileKey,
  };
}

/**
 * Generate Signed Short-Lived URL for Private Stream Playback (GET) from Cloudflare R2
 */
export async function getSignedPlaybackUrl(
  fileKey: string,
  expiresInSeconds = 86400 // 24 hours validity
) {
  const { client, bucketName } = getStorageConfig();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Robust helper to resolve raw R2 keys or pub-*.r2.dev URLs into active signed URLs
 */
export async function resolveStorageUrl(
  rawUrlOrKey: string | null | undefined,
  expiresInSeconds = 86400
): Promise<string | null> {
  if (!rawUrlOrKey) return null;

  // 1. If it's already an active presigned URL with signature, return as is
  if (
    rawUrlOrKey.includes("X-Amz-Signature") ||
    rawUrlOrKey.includes("X-Amz-Algorithm") ||
    rawUrlOrKey.includes("X-Amz-Credential")
  ) {
    return rawUrlOrKey;
  }

  // 2. If it's a regular external URL (e.g. Unsplash, Google, GitHub) and not R2
  if (
    rawUrlOrKey.startsWith("http") &&
    !rawUrlOrKey.includes(".r2.dev") &&
    !rawUrlOrKey.includes("r2.cloudflarestorage.com")
  ) {
    return rawUrlOrKey;
  }

  // 3. Extract the S3/R2 storage key
  try {
    let fileKey = rawUrlOrKey;
    if (fileKey.includes(".r2.dev/")) {
      fileKey = fileKey.split(".r2.dev/")[1];
    } else if (fileKey.includes("r2.cloudflarestorage.com/")) {
      const afterDomain = fileKey.split("r2.cloudflarestorage.com/")[1];
      const parts = afterDomain.split("/");
      fileKey = parts.slice(1).join("/"); // strip bucket name
    }

    // Clean query parameters if any
    fileKey = fileKey.split("?")[0];

    return await getSignedPlaybackUrl(fileKey, expiresInSeconds);
  } catch (err) {
    console.warn("Failed to sign storage URL:", err);
    return rawUrlOrKey;
  }
}

/**
 * Safe Asset Deletion from Cloudflare R2
 */
export async function deleteFromStorage(fileKey: string) {
  try {
    const { client, bucketName } = getStorageConfig();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });
    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete object [${fileKey}] from Cloudflare R2:`, error);
    return { success: false, error };
  }
}
