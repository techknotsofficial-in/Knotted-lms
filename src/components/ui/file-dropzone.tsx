"use client";

import React, { useState, useRef } from "react";
import { getPresignedUploadAction, deleteStorageFileAction } from "@/actions/storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  UploadCloud, 
  File, 
  Film, 
  Image as ImageIcon, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  Loader2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  purpose: "course_thumbnail" | "lesson_video" | "lesson_attachment" | "user_avatar";
  accept?: string;
  maxSizeBytes?: number;
  label?: string;
  description?: string;
  initialUrl?: string;
  initialKey?: string;
  onUploadComplete?: (result: {
    publicUrl: string;
    fileKey: string;
    fileName: string;
    fileSize: number;
  }) => void;
  onFileDeleted?: () => void;
  className?: string;
}

export function FileDropzone({
  purpose,
  accept = "*/*",
  maxSizeBytes = 500 * 1024 * 1024, // 500MB default
  label = "Upload Asset",
  description = "Drag & drop file here, or click to browse",
  initialUrl,
  initialKey,
  onUploadComplete,
  onFileDeleted,
  className,
}: FileDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialUrl || null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(initialKey || null);
  const [fileName, setFileName] = useState<string | null>(null);

  const isVideo = purpose === "lesson_video" || accept.includes("video");
  const isImage = purpose === "course_thumbnail" || purpose === "user_avatar" || accept.includes("image");

  async function handleFile(file: File) {
    setError(null);

    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      setError(`File size exceeds maximum limit of ${maxMb}MB`);
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    try {
      // 1. Request presigned URL from server
      const { uploadUrl, publicUrl, fileKey } = await getPresignedUploadAction({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        purpose,
      });

      // 2. Perform direct S3/R2 upload via XMLHttpRequest for real-time progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage server returned error code ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Direct upload failed. Please verify storage permissions or file format."));
        };

        xhr.send(file);
      });

      setUploadedUrl(publicUrl);
      setUploadedKey(fileKey);
      setProgress(100);

      onUploadComplete?.({
        publicUrl,
        fileKey,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!uploadedKey) {
      setUploadedUrl(null);
      setUploadedKey(null);
      setFileName(null);
      return;
    }

    setUploading(true);
    try {
      await deleteStorageFileAction(uploadedKey);
      setUploadedUrl(null);
      setUploadedKey(null);
      setFileName(null);
      setProgress(0);
      onFileDeleted?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deletion failed";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className={cn("space-y-3 w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!uploadedUrl ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3",
            isDragging
              ? "border-[#09090B] bg-[#F4F4F5]"
              : "border-[#E4E4E7] bg-[#FAFAFA] hover:border-[#09090B] hover:bg-[#F4F4F5]",
            uploading && "pointer-events-none opacity-80"
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E4E4E7] flex items-center justify-center text-[#09090B] shadow-xs">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#09090B]" />
            ) : isVideo ? (
              <Film className="w-6 h-6" />
            ) : isImage ? (
              <ImageIcon className="w-6 h-6" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-[#09090B]">{label}</p>
            <p className="text-xs text-[#71717A]">{description}</p>
          </div>

          {uploading ? (
            <div className="w-full max-w-xs space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold text-[#09090B]">
                <span>Uploading {fileName}...</span>
                <span className="text-emerald-600 font-bold">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          ) : (
            <Badge variant="outline" className="text-[11px] mt-1 bg-white border-[#E4E4E7] text-[#71717A]">
              Supports {accept.replace(/\/\*/g, "")}
            </Badge>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-white border border-[#E4E4E7] space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#09090B] truncate max-w-[200px] sm:max-w-xs">
                  {fileName || "Uploaded Asset"}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">Ready in Cloud Storage</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={uploading}
              className="text-xs text-red-600 hover:bg-red-50 hover:border-red-200 border-[#E4E4E7] rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Remove
            </Button>
          </div>

          {/* Media Preview if Image */}
          {isImage && uploadedUrl && (
            <div className="rounded-2xl overflow-hidden border border-[#E4E4E7] max-h-48 bg-[#FAFAFA] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedUrl}
                alt="Upload preview"
                className="max-h-48 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
