"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateLessonProgressAction({
  lessonId,
  courseId,
  watchedSec,
  totalDurationSec,
  forceComplete = false,
}: {
  lessonId: string;
  courseId: string;
  watchedSec: number;
  totalDurationSec: number;
  forceComplete?: boolean;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to record progress.");
  }

  const userId = session.user.id;
  const watchedPercent =
    totalDurationSec > 0
      ? Math.min(100, Math.round((watchedSec / totalDurationSec) * 100))
      : forceComplete
      ? 100
      : 0;

  const isCompleted = forceComplete || watchedPercent >= 90;

  // 1. Upsert UserProgress record in PostgreSQL
  const progress = await db.userProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      lastWatchedSec: Math.round(watchedSec),
      watchedPercent,
      ...(isCompleted
        ? { isCompleted: true, completedAt: new Date() }
        : {}),
    },
    create: {
      userId,
      lessonId,
      lastWatchedSec: Math.round(watchedSec),
      watchedPercent,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  // 2. Award First Knot Badge if this is their first completed lesson
  if (isCompleted) {
    const firstBadge = await db.badge.findUnique({
      where: { code: "FIRST_KNOT" },
    });

    if (firstBadge) {
      await db.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId,
            badgeId: firstBadge.id,
          },
        },
        update: {},
        create: {
          userId,
          badgeId: firstBadge.id,
        },
      });
    }

    // 3. Check if all course lessons are now completed
    const allCourseLessons = await db.lesson.findMany({
      where: {
        chapter: { courseId },
        isPublished: true,
      },
      select: { id: true },
    });

    const userCompletedLessons = await db.userProgress.findMany({
      where: {
        userId,
        lessonId: { in: allCourseLessons.map((l) => l.id) },
        isCompleted: true,
      },
    });

    if (
      allCourseLessons.length > 0 &&
      userCompletedLessons.length >= allCourseLessons.length
    ) {
      // Award Master Knot Badge
      const masterBadge = await db.badge.findUnique({
        where: { code: "MASTER_KNOT" },
      });
      if (masterBadge) {
        await db.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId,
              badgeId: masterBadge.id,
            },
          },
          update: {},
          create: {
            userId,
            badgeId: masterBadge.id,
          },
        });
      }

      // Generate Certificate record if not exists
      const certNo = `KNOT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      await db.certificate.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        update: {},
        create: {
          certificateNo: certNo,
          userId,
          courseId,
        },
      });
    }
  }

  // Only revalidate dashboard when lesson completion state actually changes
  if (isCompleted) {
    revalidatePath("/dashboard");
  }

  return {
    success: true,
    progressId: progress.id,
    isCompleted: progress.isCompleted,
    watchedPercent: progress.watchedPercent,
  };
}
