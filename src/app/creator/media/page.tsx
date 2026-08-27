"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { 
  ArrowLeft, 
  Film, 
  ImageIcon, 
  FileText, 
  HardDrive,
  Copy,
  CheckCircle2,
} from "lucide-react";

export default function CreatorMediaPage() {
  const [uploadedAssets, setUploadedAssets] = useState<
    Array<{
      id: string;
      name: string;
      url: string;
      key: string;
      size: number;
      type: string;
    }>
  >([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
              <Link href="/creator/courses">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Creator Studio
              </Link>
            </Button>
            <Logo size="default" />
          </div>

          <Badge variant="mint" className="text-[10px] uppercase font-bold">
            <HardDrive className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Direct Cloud Storage
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 space-y-10 w-full">
        {/* Title */}
        <section className="space-y-1 border-b border-[#E4E4E7] pb-6">
          <Badge variant="mint" className="text-[10px] uppercase font-bold">Media Studio</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans">
            Media Asset Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] max-w-2xl">
            Upload 4K video lectures, high-resolution thumbnails, and lesson attachments directly to cloud storage.
          </p>
        </section>

        {/* Upload Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Video Lecture Upload */}
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#09090B]">Video Lecture</h3>
              <p className="text-xs text-[#71717A]">Direct upload with progress tracking (MP4, WebM, MKV)</p>
            </div>
            <FileDropzone
              purpose="lesson_video"
              accept="video/mp4,video/webm,video/mkv,video/quicktime"
              label="Drop 4K / 1080p Video"
              description="Max file size 2GB per video"
              maxSizeBytes={2 * 1024 * 1024 * 1024}
              onUploadComplete={(res) => {
                setUploadedAssets((prev) => [
                  {
                    id: res.fileKey,
                    name: res.fileName,
                    url: res.publicUrl,
                    key: res.fileKey,
                    size: res.fileSize,
                    type: "Video",
                  },
                  ...prev,
                ]);
              }}
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#09090B]">Course Thumbnail</h3>
              <p className="text-xs text-[#71717A]">Hero banners and preview assets (JPG, PNG, WebP)</p>
            </div>
            <FileDropzone
              purpose="course_thumbnail"
              accept="image/jpeg,image/png,image/webp"
              label="Drop Thumbnail Image"
              description="16:9 aspect ratio recommended"
              maxSizeBytes={5 * 1024 * 1024}
              onUploadComplete={(res) => {
                setUploadedAssets((prev) => [
                  {
                    id: res.fileKey,
                    name: res.fileName,
                    url: res.publicUrl,
                    key: res.fileKey,
                    size: res.fileSize,
                    type: "Image",
                  },
                  ...prev,
                ]);
              }}
            />
          </div>

          {/* Lesson Attachment Upload */}
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#09090B]">Lesson Attachment</h3>
              <p className="text-xs text-[#71717A]">Cheatsheets, slides, and project source files</p>
            </div>
            <FileDropzone
              purpose="lesson_attachment"
              accept=".pdf,.zip,.tar.gz,.json,.ts"
              label="Drop Attachment File"
              description="PDF, ZIP, JSON up to 100MB"
              maxSizeBytes={100 * 1024 * 1024}
              onUploadComplete={(res) => {
                setUploadedAssets((prev) => [
                  {
                    id: res.fileKey,
                    name: res.fileName,
                    url: res.publicUrl,
                    key: res.fileKey,
                    size: res.fileSize,
                    type: "Attachment",
                  },
                  ...prev,
                ]);
              }}
            />
          </div>
        </div>

        {/* Uploaded Assets List */}
        {uploadedAssets.length > 0 && (
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#09090B]">Uploaded Media in this Session</h3>
            <div className="divide-y divide-[#F4F4F5]">
              {uploadedAssets.map((asset) => (
                <div key={asset.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#09090B] block">{asset.name}</span>
                    <span className="font-mono text-[11px] text-[#71717A] block">{asset.key}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(asset.key)}
                    className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white h-9 px-3"
                  >
                    {copiedKey === asset.key ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Copied Key
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" /> Copy Storage Key
                      </span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
