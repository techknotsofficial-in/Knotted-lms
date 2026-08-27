"use client";

import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  createChapterAction,
  reorderChaptersAction,
  deleteChapterAction,
  createLessonAction,
  reorderLessonsAction,
  updateLessonAction,
  deleteLessonAction,
} from "@/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import {
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  Film,
  FileText,
  Video,
  HelpCircle,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  PlayCircle,
  Save,
} from "lucide-react";
import { LessonType } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface CurriculumLesson {
  id: string;
  title: string;
  slug: string;
  type: LessonType;
  durationSec: number;
  sortOrder: number;
  isFree: boolean;
  videoUrl: string | null;
  content: string | null;
}

export interface CurriculumChapter {
  id: string;
  title: string;
  sortOrder: number;
  lessons: CurriculumLesson[];
}

interface CurriculumBuilderProps {
  courseId: string;
  initialChapters: CurriculumChapter[];
}

export function CurriculumBuilder({
  courseId,
  initialChapters,
}: CurriculumBuilderProps) {
  const [chapters, setChapters] = useState<CurriculumChapter[]>(initialChapters);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lesson Edit State
  const [editingLesson, setEditingLesson] = useState<{
    lesson: CurriculumLesson;
    chapterId: string;
  } | null>(null);

  // Collapsed chapter sections state
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  function toggleCollapse(chapterId: string) {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  }

  // Handle Drag and Drop End
  async function onDragEnd(result: DropResult) {
    const { destination, source, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // 1. Reordering Chapters
    if (type === "CHAPTER") {
      const items = Array.from(chapters);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const updatedChapters = items.map((ch, idx) => ({
        ...ch,
        sortOrder: idx,
      }));

      // Optimistic update
      setChapters(updatedChapters);

      // Server sync
      try {
        await reorderChaptersAction(
          courseId,
          updatedChapters.map((ch) => ({ id: ch.id, sortOrder: ch.sortOrder }))
        );
      } catch (err) {
        console.error("Failed to sync chapter order:", err);
      }
      return;
    }

    // 2. Reordering Lessons within a Chapter
    if (type === "LESSON") {
      const sourceChapterId = source.droppableId;
      const targetChapterId = destination.droppableId;

      const sourceChapterIndex = chapters.findIndex((c) => c.id === sourceChapterId);
      const targetChapterIndex = chapters.findIndex((c) => c.id === targetChapterId);

      if (sourceChapterIndex === -1 || targetChapterIndex === -1) return;

      const sourceLessons = Array.from(chapters[sourceChapterIndex].lessons);

      if (sourceChapterId === targetChapterId) {
        // Reordering in same chapter
        const [movedLesson] = sourceLessons.splice(source.index, 1);
        sourceLessons.splice(destination.index, 0, movedLesson);

        const updatedLessons = sourceLessons.map((l, idx) => ({
          ...l,
          sortOrder: idx,
        }));

        const newChapters = [...chapters];
        newChapters[sourceChapterIndex] = {
          ...newChapters[sourceChapterIndex],
          lessons: updatedLessons,
        };

        setChapters(newChapters);

        try {
          await reorderLessonsAction(
            courseId,
            updatedLessons.map((l) => ({ id: l.id, sortOrder: l.sortOrder }))
          );
        } catch (err) {
          console.error("Failed to sync lesson order:", err);
        }
      } else {
        // Moving across chapters
        const targetLessons = Array.from(chapters[targetChapterIndex].lessons);
        const [movedLesson] = sourceLessons.splice(source.index, 1);
        targetLessons.splice(destination.index, 0, movedLesson);

        const updatedSourceLessons = sourceLessons.map((l, idx) => ({ ...l, sortOrder: idx }));
        const updatedTargetLessons = targetLessons.map((l, idx) => ({ ...l, sortOrder: idx }));

        const newChapters = [...chapters];
        newChapters[sourceChapterIndex] = {
          ...newChapters[sourceChapterIndex],
          lessons: updatedSourceLessons,
        };
        newChapters[targetChapterIndex] = {
          ...newChapters[targetChapterIndex],
          lessons: updatedTargetLessons,
        };

        setChapters(newChapters);

        try {
          await reorderLessonsAction(courseId, [
            ...updatedSourceLessons.map((l) => ({ id: l.id, sortOrder: l.sortOrder, chapterId: sourceChapterId })),
            ...updatedTargetLessons.map((l) => ({ id: l.id, sortOrder: l.sortOrder, chapterId: targetChapterId })),
          ]);
        } catch (err) {
          console.error("Failed to move lesson across chapters:", err);
        }
      }
    }
  }

  // Create Chapter
  async function handleAddChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    setSaving(true);
    try {
      const res = await createChapterAction(courseId, newChapterTitle.trim());
      if (res.success && res.chapter) {
        setChapters((prev) => [
          ...prev,
          {
            id: res.chapter.id,
            title: res.chapter.title,
            sortOrder: res.chapter.sortOrder,
            lessons: [],
          },
        ]);
        setNewChapterTitle("");
        setIsAddingChapter(false);
      }
    } catch (err) {
      console.error("Error creating chapter:", err);
    } finally {
      setSaving(false);
    }
  }

  // Delete Chapter
  async function handleDeleteChapter(chapterId: string) {
    if (!confirm("Are you sure you want to delete this chapter and all its lessons?")) return;

    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    try {
      await deleteChapterAction(chapterId, courseId);
    } catch (err) {
      console.error("Error deleting chapter:", err);
    }
  }

  // Create Lesson
  async function handleAddLesson(chapterId: string, type: LessonType = LessonType.VIDEO) {
    const title = prompt("Enter lesson title:", "New Lesson");
    if (!title) return;

    try {
      const res = await createLessonAction(chapterId, courseId, { title, type });
      if (res.success && res.lesson) {
        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? {
                  ...c,
                  lessons: [
                    ...c.lessons,
                    {
                      id: res.lesson.id,
                      title: res.lesson.title,
                      slug: res.lesson.slug,
                      type: res.lesson.type,
                      durationSec: res.lesson.durationSec,
                      sortOrder: res.lesson.sortOrder,
                      isFree: res.lesson.isFree,
                      videoUrl: res.lesson.videoUrl,
                      content: res.lesson.content,
                    },
                  ],
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Error adding lesson:", err);
    }
  }

  // Delete Lesson
  async function handleDeleteLesson(lessonId: string, chapterId: string) {
    if (!confirm("Delete this lesson?")) return;

    setChapters((prev) =>
      prev.map((c) =>
        c.id === chapterId
          ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) }
          : c
      )
    );

    try {
      await deleteLessonAction(lessonId, courseId);
    } catch (err) {
      console.error("Error deleting lesson:", err);
    }
  }

  // Save Lesson Changes from Edit Drawer
  async function handleSaveLessonEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLesson) return;

    const { lesson, chapterId } = editingLesson;
    setSaving(true);

    try {
      await updateLessonAction(lesson.id, courseId, {
        title: lesson.title,
        type: lesson.type,
        videoUrl: lesson.videoUrl || "",
        durationSec: Number(lesson.durationSec) || 0,
        isFree: lesson.isFree,
        content: lesson.content || "",
      });

      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapterId
            ? {
                ...c,
                lessons: c.lessons.map((l) => (l.id === lesson.id ? lesson : l)),
              }
            : c
        )
      );
      setEditingLesson(null);
    } catch (err) {
      console.error("Error updating lesson:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chapters" type="CHAPTER">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {chapters.map((chapter, chapterIndex) => (
                <Draggable
                  key={chapter.id}
                  draggableId={chapter.id}
                  index={chapterIndex}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        "rounded-3xl border border-[#E4E4E7] bg-white shadow-xs overflow-hidden transition-all",
                        snapshot.isDragging && "ring-2 ring-[#09090B] shadow-2xl"
                      )}
                    >
                      {/* Chapter Header */}
                      <div className="px-6 py-4 flex items-center justify-between gap-3 bg-[#F4F4F5] border-b border-[#E4E4E7]">
                        <div className="flex items-center gap-3">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-[#71717A] hover:text-[#09090B] hover:bg-white"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleCollapse(chapter.id)}
                            className="flex items-center gap-2 font-bold text-sm sm:text-base text-[#09090B] hover:text-[#27272A]"
                          >
                            {collapsedChapters[chapter.id] ? (
                              <ChevronRight className="w-4 h-4 text-[#71717A]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#71717A]" />
                            )}
                            <span>{chapter.title}</span>
                          </button>

                          <Badge variant="mint" className="text-[10px] uppercase font-bold py-0.5">
                            {chapter.lessons.length} Lessons
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddLesson(chapter.id, LessonType.VIDEO)}
                            className="h-8 text-xs font-bold rounded-xl border-[#E4E4E7] bg-white text-[#09090B]"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1 text-[#09090B]" />
                            Add Lesson
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChapter(chapter.id)}
                            className="h-8 w-8 p-0 text-[#71717A] hover:text-red-600 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Chapter Lessons Droppable Container */}
                      {!collapsedChapters[chapter.id] && (
                        <Droppable droppableId={chapter.id} type="LESSON">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="p-4 space-y-2.5 min-h-[60px] bg-white"
                            >
                              {chapter.lessons.length === 0 ? (
                                <div className="p-6 rounded-2xl border border-dashed border-[#E4E4E7] text-center text-xs text-[#71717A]">
                                  No lessons in this module yet. Click &ldquo;Add Lesson&rdquo; to begin.
                                </div>
                              ) : (
                                chapter.lessons.map((lesson, lessonIndex) => (
                                  <Draggable
                                    key={lesson.id}
                                    draggableId={lesson.id}
                                    index={lessonIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={cn(
                                          "p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] flex items-center justify-between gap-3 transition-all hover:border-[#09090B] hover:bg-white",
                                          snapshot.isDragging &&
                                            "ring-2 ring-[#09090B] shadow-lg bg-white"
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing p-1 text-[#71717A] hover:text-[#09090B]"
                                          >
                                            <GripVertical className="w-4 h-4" />
                                          </div>

                                          <div className="w-8 h-8 rounded-xl bg-white border border-[#E4E4E7] flex items-center justify-center text-[#09090B] shadow-2xs">
                                            {lesson.type === LessonType.VIDEO ? (
                                              <Film className="w-4 h-4" />
                                            ) : lesson.type === LessonType.TEXT ? (
                                              <FileText className="w-4 h-4" />
                                            ) : lesson.type === LessonType.LIVE ? (
                                              <Video className="w-4 h-4" />
                                            ) : (
                                              <HelpCircle className="w-4 h-4" />
                                            )}
                                          </div>

                                          <div>
                                            <p className="text-xs sm:text-sm font-bold text-[#09090B]">
                                              {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 text-[11px] text-[#71717A] font-mono">
                                              <span>{lesson.type}</span>
                                              {lesson.durationSec > 0 && (
                                                <>
                                                  <span>•</span>
                                                  <span>{Math.floor(lesson.durationSec / 60)} mins</span>
                                                </>
                                              )}
                                              {lesson.isFree && (
                                                <Badge variant="mint" className="text-[9px] uppercase font-bold py-0">
                                                  Free Preview
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setEditingLesson({
                                                lesson: { ...lesson },
                                                chapterId: chapter.id,
                                              })
                                            }
                                            className="h-8 px-3 text-xs font-bold rounded-xl border-[#E4E4E7] bg-white text-[#09090B]"
                                          >
                                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                                            Edit
                                          </Button>

                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteLesson(lesson.id, chapter.id)
                                            }
                                            className="h-8 w-8 p-0 text-[#71717A] hover:text-red-600 rounded-xl"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Chapter Form */}
      {isAddingChapter ? (
        <form
          onSubmit={handleAddChapter}
          className="p-6 rounded-3xl border border-[#09090B] bg-white space-y-4 shadow-sm animate-in fade-in-50"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
              Add New Chapter Module
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingChapter(false)}
              className="text-[#71717A] hover:text-[#09090B]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <Input
            placeholder="e.g. Chapter 2: High-Concurrency Edge Architecture"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            className="bg-[#FAFAFA] rounded-xl h-11"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={saving || !newChapterTitle.trim()}
              className="bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold h-9 px-4"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : "Save Chapter"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingChapter(false)}
              className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border-dashed border-[#E4E4E7] text-[#09090B] bg-white hover:border-[#09090B] hover:bg-[#F4F4F5] rounded-2xl font-bold text-xs shadow-2xs"
          onClick={() => setIsAddingChapter(true)}
        >
          <Plus className="w-4 h-4 mr-2 text-[#09090B]" />
          Add Chapter Module
        </Button>
      )}

      {/* Edit Lesson Modal / Drawer */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 text-[#09090B]">
            <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#09090B] font-sans">
                  Edit Lesson Details
                </h3>
                <p className="text-xs text-[#71717A]">
                  Configure video media, rich content, and access preview settings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="p-1 rounded-xl text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLessonEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                  Lesson Title
                </label>
                <Input
                  value={editingLesson.lesson.title}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lesson: { ...editingLesson.lesson, title: e.target.value },
                    })
                  }
                  className="bg-[#FAFAFA] rounded-xl h-11"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Lesson Type
                  </label>
                  <select
                    value={editingLesson.lesson.type}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          type: e.target.value as LessonType,
                        },
                      })
                    }
                    className="flex h-11 w-full rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2 text-xs sm:text-sm text-[#09090B] focus:ring-2 focus:ring-[#09090B] focus:outline-none"
                  >
                    <option value={LessonType.VIDEO}>Video Lecture</option>
                    <option value={LessonType.TEXT}>Text Article</option>
                    <option value={LessonType.LIVE}>Live Cohort Class</option>
                    <option value={LessonType.QUIZ}>Quiz Assessment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Estimated Duration (Seconds)
                  </label>
                  <Input
                    type="number"
                    value={editingLesson.lesson.durationSec}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          durationSec: Number(e.target.value),
                        },
                      })
                    }
                    className="bg-[#FAFAFA] font-mono rounded-xl h-11"
                  />
                </div>
              </div>

              {/* Free Preview Toggle */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7]">
                <input
                  type="checkbox"
                  id="isFreeCheckbox"
                  checked={editingLesson.lesson.isFree}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lesson: {
                        ...editingLesson.lesson,
                        isFree: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-[#09090B] rounded cursor-pointer"
                />
                <label
                  htmlFor="isFreeCheckbox"
                  className="text-xs font-bold text-[#09090B] cursor-pointer"
                >
                  Enable as Free Preview Lesson (Available without enrollment)
                </label>
              </div>

              {/* Video Upload Dropzone if type is VIDEO */}
              {editingLesson.lesson.type === LessonType.VIDEO && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Video Stream
                  </label>
                  <FileDropzone
                    purpose="lesson_video"
                    accept="video/*"
                    initialUrl={editingLesson.lesson.videoUrl || undefined}
                    onUploadComplete={(res) => {
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          videoUrl: res.publicUrl,
                        },
                      });
                    }}
                    onFileDeleted={() => {
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          videoUrl: null,
                        },
                      });
                    }}
                  />
                </div>
              )}

              {/* TipTap Rich Text Editor if type is TEXT */}
              {editingLesson.lesson.type === LessonType.TEXT && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Lesson Content
                  </label>
                  <RichTextEditor
                    content={editingLesson.lesson.content || ""}
                    onChange={(html) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          content: html,
                        },
                      })
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F4F4F5]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLesson(null)}
                  className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={saving}
                  className="bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold h-10 px-6 shadow-xs"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" />
                      Save Lesson Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
