"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, deleteFromStorage, resolveStorageUrl } from "@/lib/storage";
import { z } from "zod";

const uploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "MIME type is required"),
  fileSize: z.number().max(2 * 1024 * 1024 * 1024, "File size must not exceed 2GB"), // 2GB limit
  purpose: z.enum([
    "course_thumbnail",
    "lesson_video",
    "lesson_attachment",
    "user_avatar",
    "certificate_pdf",
  ]),
});

export async function getPresignedUploadAction(data: z.infer<typeof uploadSchema>) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to upload files.");
  }

  const validation = uploadSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const { fileName, fileType, purpose } = validation.data;
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const fileKey = `${purpose}/${session.user.id}/${timestamp}-${sanitizedName}`;

  const result = await getPresignedUploadUrl({
    fileKey,
    contentType: fileType,
    expiresInSeconds: 300, // 5 minutes
  });

  return {
    success: true,
    uploadUrl: result.uploadUrl,
    publicUrl: result.publicUrl,
    fileKey: result.fileKey,
  };
}

export async function resolveMediaUrlAction(rawUrlOrKey: string | null | undefined) {
  if (!rawUrlOrKey) return null;
  return await resolveStorageUrl(rawUrlOrKey, 86400); // 24 hours
}

export async function deleteStorageFileAction(fileKey: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to delete files.");
  }

  if (!fileKey) {
    throw new Error("File key is required for deletion.");
  }

  const result = await deleteFromStorage(fileKey);
  return result;
}
