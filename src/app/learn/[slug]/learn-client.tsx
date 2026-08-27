"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CoursePlayer } from "@/components/player/course-player";
import { RichTextViewer } from "@/components/editor/rich-text-viewer";
import { updateLessonProgressAction } from "@/actions/progress";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  Film,
  FileText,
  Video,
  Layers,
  Award,
  Download,
  ChevronRight,
  Sparkles,
  Lock,
  ChevronDown,
  BookOpen,
  Paperclip,
  Check,
  FolderOpen,
} from "lucide-react";
import { LessonType } from "@prisma/client";
import { cn, formatDuration } from "@/lib/utils";

interface LearnClientProps {
  course: {
    id: string;
    title: string;
    slug: string;
    chapters: {
      id: string;
      title: string;
      sortOrder: number;
      lessons: {
        id: string;
        title: string;
        slug: string;
        type: LessonType;
        durationSec: number;
        sortOrder: number;
        isFree: boolean;
        videoUrl: string | null;
        content: string | null;
        attachments?: { id: string; name: string; fileUrl: string; fileSize: number }[];
      }[];
    }[];
  };
  progressMap: Record<string, { isCompleted: boolean; lastWatchedSec: number }>;
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export function LearnClient({ course, progressMap, user }: LearnClientProps) {
  const router = useRouter();

  // All lessons flat array for sequential navigation
  const allLessons = course.chapters.flatMap((c) => c.lessons);
  const [activeLessonId, setActiveLessonId] = useState<string>(
    allLessons[0]?.id || ""
  );
  const [localProgress, setLocalProgress] = useState(progressMap);
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "resources">("overview");

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
  const activeIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const nextLesson = allLessons[activeIndex + 1] || null;
  const prevLesson = allLessons[activeIndex - 1] || null;

  // Calculate course completion percentage
  const completedCount = allLessons.filter(
    (l) => localProgress[l.id]?.isCompleted
  ).length;
  const overallPercent =
    allLessons.length > 0
      ? Math.round((completedCount / allLessons.length) * 100)
      : 0;

  async function handleToggleComplete(lessonId: string) {
    const isCurrentlyCompleted = localProgress[lessonId]?.isCompleted || false;
    const nextState = !isCurrentlyCompleted;

    setLocalProgress((prev) => ({
      ...prev,
      [lessonId]: {
        isCompleted: nextState,
        lastWatchedSec: prev[lessonId]?.lastWatchedSec || 0,
      },
    }));

    try {
      await updateLessonProgressAction({
        lessonId,
        courseId: course.id,
        watchedSec: activeLesson?.durationSec || 0,
        totalDurationSec: activeLesson?.durationSec || 1,
        forceComplete: nextState,
      });
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* Top Theater Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] px-6 py-3.5 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Back & Course Title */}
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-semibold rounded-xl bg-white border-[#E4E4E7] text-[#09090B] hover:bg-[#F4F4F5]"
            >
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Dashboard
              </Link>
            </Button>
            <Logo size="default" showText={false} />
            <span className="text-sm sm:text-base font-bold text-[#09090B] truncate max-w-xs sm:max-w-md font-sans">
              {course.title}
            </span>
          </div>

          {/* Right: Progress Indicator & Certificate Status */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs font-medium text-[#71717A]">Progress:</span>
              <div className="w-32 h-2 bg-[#E4E4E7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#09090B] transition-all duration-300"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-[#09090B]">{overallPercent}%</span>
            </div>

            {overallPercent === 100 && (
              <Badge variant="mint" className="text-xs font-bold px-3 py-1">
                <Award className="w-3.5 h-3.5 mr-1" />
                Certificate Ready
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Fluid Classroom Theater Grid */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Stage: 8 Columns (Player + Action Bar + Tabbed Notes) */}
        <div className="lg:col-span-8 space-y-6">
          {/* High-Performance Course Video Player */}
          {activeLesson?.type === LessonType.VIDEO ? (
            <CoursePlayer
              videoUrl={activeLesson.videoUrl}
              lessonId={activeLesson.id}
              courseId={course.id}
              lessonTitle={activeLesson.title}
              userEmail={user.email}
              userId={user.id}
              initialProgressSec={localProgress[activeLesson.id]?.lastWatchedSec || 0}
              isCompleted={localProgress[activeLesson.id]?.isCompleted || false}
              onLessonCompleted={() => {
                setLocalProgress((prev) => ({
                  ...prev,
                  [activeLesson.id]: { isCompleted: true, lastWatchedSec: activeLesson.durationSec },
                }));
              }}
            />
          ) : (
            <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs min-h-[380px]">
              <RichTextViewer content={activeLesson?.content || ""} />
            </div>
          )}

          {/* Lesson Action Bar & Quick Nav Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E4E4E7] shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#09090B] border border-[#E4E4E7]">
                  {activeLesson?.type || "VIDEO"}
                </span>
                {activeLesson?.isFree && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Free Preview
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#09090B] font-sans">
                {activeLesson?.title}
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <Button
                variant={localProgress[activeLesson?.id]?.isCompleted ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleComplete(activeLesson.id)}
                className={cn(
                  "font-bold text-xs rounded-xl shadow-xs",
                  localProgress[activeLesson?.id]?.isCompleted
                    ? "bg-[#09090B] text-white hover:bg-[#27272A]"
                    : "bg-white border-[#E4E4E7] text-[#09090B] hover:bg-[#F4F4F5]"
                )}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                {localProgress[activeLesson?.id]?.isCompleted ? "Lesson Completed" : "Mark Complete"}
              </Button>

              {prevLesson && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveLessonId(prevLesson.id)}
                  className="text-xs font-semibold rounded-xl bg-white border-[#E4E4E7]"
                >
                  Previous
                </Button>
              )}

              {nextLesson && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setActiveLessonId(nextLesson.id)}
                  className="bg-[#09090B] text-white hover:bg-[#27272A] text-xs font-bold rounded-xl"
                >
                  Next Lesson
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Tabbed Lesson Resources & Notes Area (Fills space with useful data) */}
          <div className="rounded-3xl border border-[#E4E4E7] bg-white shadow-xs p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-[#E4E4E7] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "text-xs sm:text-sm font-bold pb-2 transition-colors relative",
                  activeTab === "overview"
                    ? "text-[#09090B] after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-[#09090B]"
                    : "text-[#71717A] hover:text-[#09090B]"
                )}
              >
                Lesson Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "text-xs sm:text-sm font-bold pb-2 transition-colors relative",
                  activeTab === "notes"
                    ? "text-[#09090B] after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-[#09090B]"
                    : "text-[#71717A] hover:text-[#09090B]"
                )}
              >
                Interactive Notes
              </button>

              {activeLesson?.attachments && activeLesson.attachments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("resources")}
                  className={cn(
                    "text-xs sm:text-sm font-bold pb-2 transition-colors relative",
                    activeTab === "resources"
                      ? "text-[#09090B] after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-[#09090B]"
                      : "text-[#71717A] hover:text-[#09090B]"
                  )}
                >
                  Attachments ({activeLesson.attachments.length})
                </button>
              )}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#09090B]">About this masterclass module</h3>
                <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
                  {activeLesson?.content ? (
                    <RichTextViewer content={activeLesson.content} />
                  ) : (
                    "This technical module covers architectural fundamentals, direct pipeline streaming, and production best practices. Complete the video playback to record your verified progress toward course certification."
                  )}
                </p>
              </div>
            )}

            {/* Tab 2: Notes */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#09090B]">
                    <Sparkles className="w-4 h-4" />
                    <span>Personal Key Takeaways</span>
                  </div>
                  <textarea
                    placeholder="Type personal notes, timestamps, or code snippets for this lesson..."
                    className="w-full min-h-[120px] p-3 text-xs bg-white border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B]"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" className="bg-[#09090B] text-white text-xs rounded-lg font-bold">
                      Save Notes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Resources */}
            {activeTab === "resources" && (
              <div className="space-y-2">
                {activeLesson?.attachments?.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[#E4E4E7] hover:border-[#09090B] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="w-4 h-4 text-[#71717A]" />
                      <span className="text-xs font-bold text-[#09090B]">{att.name}</span>
                    </div>
                    <Download className="w-4 h-4 text-[#71717A]" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Drawer: 4 Columns (Sticky Structured Curriculum Navigation) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-20 rounded-3xl border border-[#E4E4E7] bg-white shadow-xs overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E4E4E7] bg-[#FAFAFA] space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#09090B] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Curriculum Navigation</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[#71717A]">
                  {completedCount}/{allLessons.length} Completed
                </span>
              </div>
              <Progress value={overallPercent} className="h-1.5" />
            </div>

            {/* Chapters & Lessons Accordion List */}
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-[#F4F4F5]">
              {course.chapters.map((chapter, chIdx) => (
                <div key={chapter.id} className="p-3">
                  <div className="px-3 py-2 text-xs font-bold text-[#71717A] uppercase tracking-wider flex items-center justify-between">
                    <span>Module {chIdx + 1}: {chapter.title}</span>
                    <span className="text-[10px] font-mono text-[#A1A1AA]">{chapter.lessons.length}</span>
                  </div>

                  <div className="space-y-1 mt-1">
                    {chapter.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLessonId;
                      const isDone = localProgress[lesson.id]?.isCompleted;

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setActiveLessonId(lesson.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl text-left transition-all",
                            isActive
                              ? "bg-[#09090B] text-white shadow-sm"
                              : "hover:bg-[#F4F4F5] text-[#09090B]"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                                isDone
                                  ? isActive
                                    ? "bg-white text-[#09090B] border-white"
                                    : "bg-emerald-500 text-white border-emerald-500"
                                  : isActive
                                  ? "border-white/40 text-white"
                                  : "border-[#E4E4E7] text-[#71717A]"
                              )}
                            >
                              {isDone ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5" />
                              )}
                            </div>

                            <span className="text-xs font-medium truncate">
                              {lesson.title}
                            </span>
                          </div>

                          <div className="text-[10px] font-mono shrink-0 text-[#71717A]">
                            {lesson.durationSec > 0 && (
                              <span className={cn(isActive && "text-white/60")}>
                                {Math.ceil(lesson.durationSec / 60)}m
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
