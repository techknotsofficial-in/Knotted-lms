"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateCourseAction, deleteCourseAction } from "@/actions/courses";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CurriculumBuilder, CurriculumChapter } from "@/components/curriculum/curriculum-builder";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  ArrowLeft,
  Save,
  Globe,
  Trash2,
  CheckCircle2,
  Eye,
  Loader2,
  Settings,
  Layers,
  Sparkles,
} from "lucide-react";
import { CourseLevel } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

interface CourseEditorClientProps {
  course: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    description: string | null;
    thumbnailUrl: string | null;
    price: number;
    level: CourseLevel;
    category: string;
    isPublished: boolean;
    chapters: CurriculumChapter[];
  };
}

export function CourseEditorClient({ course }: CourseEditorClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"curriculum" | "settings">("curriculum");

  // Course Settings state
  const [title, setTitle] = useState(course.title);
  const [subtitle, setSubtitle] = useState(course.subtitle || "");
  const [description, setDescription] = useState(course.description || "");
  const [price, setPrice] = useState(course.price.toString());
  const [category, setCategory] = useState(course.category);
  const [level, setLevel] = useState<CourseLevel>(course.level);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course.thumbnailUrl);
  const [isPublished, setIsPublished] = useState(course.isPublished);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateCourseAction(course.id, {
        title,
        subtitle,
        description,
        price: Number(price) || 0,
        category,
        level,
        thumbnailUrl: thumbnailUrl || undefined,
        isPublished,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      router.refresh();
    } catch (err) {
      console.error("Failed to save course settings:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    const nextPublished = !isPublished;
    setIsPublished(nextPublished);
    setSaving(true);
    try {
      await updateCourseAction(course.id, { isPublished: nextPublished });
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
      setIsPublished(!nextPublished);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCourse() {
    if (!confirm("Are you sure you want to permanently delete this course and all attached media?")) return;
    try {
      await deleteCourseAction(course.id);
      router.push("/creator/courses");
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  }

  const totalLessons = course.chapters.flatMap((c) => c.lessons).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
              <Link href="/creator/courses">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Course Library
              </Link>
            </Button>
            <Logo size="default" />
          </div>

          <div className="flex items-center gap-3">
            {/* Publish Toggle */}
            <Button
              variant={isPublished ? "default" : "outline"}
              size="sm"
              onClick={handleTogglePublish}
              disabled={saving}
              className={isPublished ? "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold" : "rounded-xl border-[#E4E4E7] text-xs font-bold bg-white"}
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              {isPublished ? "Published" : "Draft (Click to Publish)"}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold shadow-xs h-9 px-4"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" />
                  Saved
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 space-y-8 w-full">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? "default" : "outline"} className={isPublished ? "bg-emerald-600 text-white text-[10px] uppercase font-bold" : "text-[10px] text-[#71717A]"}>
                {isPublished ? "Public & Enrolling" : "Draft Mode"}
              </Badge>
              <span className="text-xs font-mono text-[#71717A]">
                {course.chapters.length} Modules • {totalLessons} Lessons
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#09090B] font-sans">
              {title}
            </h1>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7] self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("curriculum")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "curriculum"
                  ? "bg-[#09090B] text-white shadow-xs"
                  : "text-[#71717A] hover:text-[#09090B]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Curriculum (DnD)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settings"
                  ? "bg-[#09090B] text-white shadow-xs"
                  : "text-[#71717A] hover:text-[#09090B]"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Masterclass Settings
            </button>
          </div>
        </div>

        {/* Tab 1: Drag & Drop Curriculum Builder */}
        {activeTab === "curriculum" && (
          <div className="space-y-6">
            <CurriculumBuilder
              courseId={course.id}
              initialChapters={course.chapters}
            />
          </div>
        )}

        {/* Tab 2: Course Settings */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-6 rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Course Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-[#FAFAFA] text-base h-12 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Subtitle / Short Teaser
                  </label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Short one-line summary of what makes this course unique..."
                    className="bg-[#FAFAFA] rounded-xl h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-11 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] px-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#09090B]"
                    >
                      <option value="Full-Stack Development">Full-Stack Development</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Cloud Architecture">Cloud Architecture</option>
                      <option value="Edge Security">Edge Security</option>
                      <option value="UI/UX Engineering">UI/UX Engineering</option>
                      <option value="Networking">Networking</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                      Level
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                      Price (INR ₹)
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
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Full Course Description
                  </label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 text-xs sm:text-sm bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B]"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-[#F4F4F5]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Course Thumbnail Banner
                  </label>
                  <FileDropzone
                    purpose="course_thumbnail"
                    accept="image/*"
                    maxSizeBytes={5 * 1024 * 1024}
                    initialUrl={thumbnailUrl || undefined}
                    onUploadComplete={(file) => {
                      setThumbnailUrl(file.publicUrl);
                    }}
                    label="Upload masterclass banner image"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-[#F4F4F5]">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold h-11 px-8 shadow-xs"
                  >
                    {saving ? "Saving Changes..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Right Column: Danger Zone & Actions */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#09090B]">
                  Course Preview Link
                </h3>
                <p className="text-xs text-[#71717A]">
                  View the public landing page as prospective students see it.
                </p>
                <Button variant="outline" size="sm" asChild className="w-full rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
                  <Link href={`/courses/${course.slug}`} target="_blank">
                    <Eye className="w-4 h-4 mr-1.5" />
                    Open Public Page
                  </Link>
                </Button>
              </div>

              <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-900">
                  Danger Zone
                </h3>
                <p className="text-xs text-red-700 leading-relaxed">
                  Deleting this course will permanently remove all associated chapters, lesson attachments, and enrollment progress.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteCourse}
                  className="w-full rounded-xl text-xs font-bold"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Course Permanently
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
