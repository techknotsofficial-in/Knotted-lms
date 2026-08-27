import React from "react";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CourseEditorClient } from "./course-editor-client";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseEditorPage({ params }: PageProps) {
  const { courseId } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/login");
  }

  const course = await db.course.findFirst({
    where: {
      id: courseId,
      instructorId: session.user.id,
    },
    include: {
      chapters: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const formattedCourse = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    previewVideo: course.previewVideo,
    price: Number(course.price),
    currency: course.currency,
    level: course.level,
    category: course.category,
    isPublished: course.isPublished,
    instructorId: course.instructorId,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    chapters: course.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      sortOrder: ch.sortOrder,
      lessons: ch.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        type: l.type,
        durationSec: l.durationSec,
        sortOrder: l.sortOrder,
        isFree: l.isFree,
        videoUrl: l.videoUrl,
        content: l.content,
      })),
    })),
  };

  return <CourseEditorClient course={formattedCourse} />;
}
