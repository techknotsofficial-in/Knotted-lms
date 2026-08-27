"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCourseAction } from "@/actions/courses";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { CourseLevel } from "@prisma/client";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Full-Stack Development");
  const [level, setLevel] = useState<CourseLevel>(CourseLevel.ALL_LEVELS);
  const [price, setPrice] = useState("0");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please provide a course title");
      return;
    }

    setLoading(true);
    try {
      const res = await createCourseAction({
        title: title.trim(),
        category,
        level,
        price: Number(price) || 0,
        description,
        thumbnailUrl: thumbnailUrl || undefined,
      });

      if (res.success && res.courseId) {
        router.push(`/creator/courses/${res.courseId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create course";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
              <Link href="/creator/courses">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Course Library
              </Link>
            </Button>
            <Logo size="default" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 space-y-8 w-full">
        <div className="space-y-1">
          <Badge variant="mint" className="text-[10px] uppercase font-bold">Course Creator Studio</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans">
            Create a New Masterclass
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A]">
            Set up the foundation for your curriculum. You can add interactive chapters, lessons, and high-definition video modules next.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
              Masterclass Title
            </label>
            <Input
              placeholder="e.g. Enterprise Next.js 16 & Server Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#FAFAFA] text-base h-12 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                Primary Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] px-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#09090B]"
              >
                <option value="Full-Stack Development">Full-Stack Development</option>
                <option value="Artificial Intelligence">Artificial Intelligence (AI)</option>
                <option value="Cloud Architecture">Cloud Architecture</option>
                <option value="Edge Security">Edge Security</option>
                <option value="UI/UX Engineering">UI/UX Engineering</option>
                <option value="Networking">Networking</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                Experience Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="w-full h-11 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] px-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#09090B]"
              >
                <option value={CourseLevel.BEGINNER}>Beginner</option>
                <option value={CourseLevel.INTERMEDIATE}>Intermediate</option>
                <option value={CourseLevel.ADVANCED}>Advanced</option>
                <option value={CourseLevel.ALL_LEVELS}>All Levels</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
              Price (INR ₹ - 0 for Free Preview)
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-[#FAFAFA] font-mono h-11 rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
              Course Description & Objectives
            </label>
            <textarea
              placeholder="Provide a comprehensive summary of the concepts, architectural patterns, and practical skills students will master..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[120px] p-3 text-xs sm:text-sm bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B]"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F4F4F5]">
            <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
              Course Thumbnail Image
            </label>
            <FileDropzone
              purpose="course_thumbnail"
              accept="image/*"
              maxSizeBytes={5 * 1024 * 1024}
              initialUrl={thumbnailUrl || undefined}
              onUploadComplete={(file) => {
                setThumbnailUrl(file.publicUrl);
              }}
              label="Drop course banner image here (16:9 recommended)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#F4F4F5]">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold h-11 px-8 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Creating Course...
                </>
              ) : (
                "Save & Build Curriculum"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
