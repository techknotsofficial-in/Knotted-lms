import React from "react";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkUserEnrollment } from "@/lib/courses";
import { getSignedPlaybackUrl } from "@/lib/storage";
import { LearnClient } from "./learn-client";

interface LearnPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Extract R2 Storage File Key from stored URL or Key
 */
function extractR2Key(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  if (urlOrKey.startsWith("lesson_video/") || urlOrKey.startsWith("course_thumbnail/")) {
    return urlOrKey;
  }
  const match = urlOrKey.match(/(lesson_video\/[^\s?#]+)/);
  if (match) return match[1];
  return null;
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { slug } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect(`/login?redirect=/learn/${slug}`);
  }

  // Fetch course with curriculum from PostgreSQL
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" },
            include: {
              attachments: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Check enrollment (instructors of the course bypass enrollment)
  const isInstructor = course.instructorId === session.user.id;
  const isEnrolled = isInstructor || (await checkUserEnrollment(session.user.id, course.id));

  // If not enrolled and no free preview, redirect to course details
  if (!isEnrolled) {
    const hasFreeLesson = course.chapters.some((c) =>
      c.lessons.some((l) => l.isFree)
    );
    if (!hasFreeLesson) {
      redirect(`/courses/${slug}`);
    }
  }

  // Fetch all user progress records for this course
  const allLessonIds = course.chapters.flatMap((c) => c.lessons.map((l) => l.id));
  const userProgresses = await db.userProgress.findMany({
    where: {
      userId: session.user.id,
      lessonId: { in: allLessonIds },
    },
  });

  const progressMap: Record<
    string,
    { isCompleted: boolean; lastWatchedSec: number }
  > = {};

  userProgresses.forEach((p) => {
    progressMap[p.lessonId] = {
      isCompleted: p.isCompleted,
      lastWatchedSec: p.lastWatchedSec,
    };
  });

  // Dynamically generate signed Cloudflare R2 playback URLs for protected video streaming
  const chaptersWithSignedUrls = await Promise.all(
    course.chapters.map(async (ch) => {
      const lessonsWithSignedUrls = await Promise.all(
        ch.lessons.map(async (l) => {
          let resolvedVideoUrl = l.videoUrl;

          const r2Key = extractR2Key(l.videoUrl);
          if (r2Key) {
            try {
              resolvedVideoUrl = await getSignedPlaybackUrl(r2Key, 7200); // 2 hours signed stream token
            } catch (err) {
              console.warn(`Failed to sign R2 playback URL for [${r2Key}]:`, err);
            }
          }

          return {
            id: l.id,
            title: l.title,
            slug: l.slug,
            type: l.type,
            durationSec: l.durationSec,
            sortOrder: l.sortOrder,
            isFree: l.isFree,
            videoUrl: resolvedVideoUrl,
            content: l.content,
            attachments: l.attachments.map((a) => ({
              id: a.id,
              name: a.name,
              fileUrl: a.fileUrl,
              fileSize: a.fileSize,
            })),
          };
        })
      );

      return {
        id: ch.id,
        title: ch.title,
        sortOrder: ch.sortOrder,
        lessons: lessonsWithSignedUrls,
      };
    })
  );

  const formattedCourse = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    chapters: chaptersWithSignedUrls,
  };

  return (
    <LearnClient
      course={formattedCourse}
      progressMap={progressMap}
      user={session.user}
    />
  );
}
