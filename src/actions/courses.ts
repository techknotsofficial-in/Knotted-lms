"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CourseLevel, LessonType } from "@prisma/client";
import { z } from "zod";

async function getAuthenticatedUser() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to manage courses.");
  }
  return session.user;
}

// -----------------------------------------------------------------------------
// 1. COURSE CRUD ACTIONS
// -----------------------------------------------------------------------------

const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string().default("Development"),
  level: z.nativeEnum(CourseLevel).default(CourseLevel.ALL_LEVELS),
  price: z.number().min(0, "Price must be non-negative").default(0),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export async function createCourseAction(data: z.infer<typeof createCourseSchema>) {
  const user = await getAuthenticatedUser();
  const validated = createCourseSchema.parse(data);

  // Generate unique slug
  const baseSlug = validated.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const course = await db.course.create({
    data: {
      title: validated.title,
      slug,
      category: validated.category,
      level: validated.level,
      price: validated.price,
      description: validated.description,
      thumbnailUrl: validated.thumbnailUrl,
      instructorId: user.id,
      chapters: {
        create: {
          title: "Chapter 1: Getting Started",
          sortOrder: 0,
          lessons: {
            create: {
              title: "Welcome to the Course",
              slug: "welcome-to-the-course",
              sortOrder: 0,
              type: LessonType.VIDEO,
              isFree: true,
            },
          },
        },
      },
    },
  });

  revalidatePath("/creator/courses");
  return { success: true, courseId: course.id, slug: course.slug };
}

export async function updateCourseAction(
  courseId: string,
  data: Partial<{
    title: string;
    subtitle: string;
    description: string;
    thumbnailUrl: string;
    price: number;
    level: CourseLevel;
    category: string;
    isPublished: boolean;
  }>
) {
  const user = await getAuthenticatedUser();

  const existing = await db.course.findFirst({
    where: { id: courseId, instructorId: user.id },
  });

  if (!existing) {
    throw new Error("Course not found or unauthorized.");
  }

  const updated = await db.course.update({
    where: { id: courseId },
    data,
  });

  revalidatePath(`/creator/courses/${courseId}`);
  revalidatePath("/courses");
  return {
    success: true,
    course: {
      ...updated,
      price: Number(updated.price),
    },
  };
}

export async function deleteCourseAction(courseId: string) {
  const user = await getAuthenticatedUser();

  await db.course.deleteMany({
    where: { id: courseId, instructorId: user.id },
  });

  revalidatePath("/creator/courses");
  return { success: true };
}

// -----------------------------------------------------------------------------
// 2. CHAPTER ACTIONS & REORDERING
// -----------------------------------------------------------------------------

export async function createChapterAction(courseId: string, title: string) {
  const user = await getAuthenticatedUser();

  const course = await db.course.findFirst({
    where: { id: courseId, instructorId: user.id },
    include: { chapters: { select: { sortOrder: true } } },
  });

  if (!course) throw new Error("Unauthorized");

  const nextSortOrder = course.chapters.length;

  const chapter = await db.chapter.create({
    data: {
      title: title.trim() || "Untitled Chapter",
      sortOrder: nextSortOrder,
      courseId,
    },
    include: {
      lessons: true,
    },
  });

  revalidatePath(`/creator/courses/${courseId}`);
  return { success: true, chapter };
}

export async function reorderChaptersAction(
  courseId: string,
  reorderedChapters: { id: string; sortOrder: number }[]
) {
  const user = await getAuthenticatedUser();

  const course = await db.course.findFirst({
    where: { id: courseId, instructorId: user.id },
  });
  if (!course) throw new Error("Unauthorized");

  await db.$transaction(
    reorderedChapters.map((ch) =>
      db.chapter.update({
        where: { id: ch.id },
        data: { sortOrder: ch.sortOrder },
      })
    )
  );

  revalidatePath(`/creator/courses/${courseId}`);
  return { success: true };
}

export async function deleteChapterAction(chapterId: string, courseId: string) {
  await getAuthenticatedUser();

  await db.chapter.delete({
    where: { id: chapterId },
  });

  revalidatePath(`/creator/courses/${courseId}`);
  return { success: true };
}

// -----------------------------------------------------------------------------
// 3. LESSON ACTIONS & REORDERING
// -----------------------------------------------------------------------------

export async function createLessonAction(
  chapterId: string,
  courseId: string,
  data: {
    title: string;
    type?: LessonType;
  }
) {
  await getAuthenticatedUser();

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { lessons: { select: { sortOrder: true } } },
  });

  if (!chapter) throw new Error("Chapter not found");

  const baseSlug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const lesson = await db.lesson.create({
    data: {
      title: data.title.trim() || "New Lesson",
      slug,
      type: data.type || LessonType.VIDEO,
      sortOrder: chapter.lessons.length,
      chapterId,
    },
  });

  revalidatePath(`/creator/courses/${courseId}`);
  return { success: true, lesson };
}

export async function updateLessonAction(
  lessonId: string,
  courseId: string,
  data: Partial<{
    title: string;
    content: string;
    videoUrl: string;
    durationSec: number;
    isFree: boolean;
    type: LessonType;
  }>
) {
  await getAuthenticatedUser();

  const updated = await db.lesson.update({
    where: { id: lessonId },
    data,
  });

  revalidatePath(`/creator/courses/${courseId}`);
  return { success: true, lesson: updated };
}

export async function reorderLessonsAction(
  courseId: string,
  reorderedLessons: { id: string; sortOrder: number; chapterId?: string }[]
) {
  await getAuthenticatedUser();

  await db.$transaction(
    reorderedLessons.map((l) =>
      db.lesson.update({
        where: { id: l.id },
        data: {
          sortOrder: l.sortOrder,
          ...(l.chapterId ? { chapterId: l.chapterId } : {}),
        },
      })
    )
  );

  revalidatePath(`/creator/courses/${courseId}`);
  return { success: true };
}

export async function deleteLessonAction(lessonId: string, courseId: string) {
  await getAuthenticatedUser();

  await db.lesson.delete({
    where: { id: lessonId },
  });

  revalidatePath(`/creator/courses/${courseId}`);
  return { success: true };
}
