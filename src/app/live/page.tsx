import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";
import { LiveCohortsClient, LiveSessionItem } from "./live-cohorts-client";

export default async function GlobalLiveCohortsPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  const userId = session?.user?.id;

  // Fetch all open and active live sessions across published courses
  const liveSessions = await db.liveSession.findMany({
    where: {
      isEnded: false,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          thumbnailUrl: true,
          instructor: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      attendees: {
        select: { userId: true },
      },
    },
    orderBy: [
      { isLive: "desc" },
      { scheduledAt: "asc" },
    ],
  });

  const formattedSessions: LiveSessionItem[] = liveSessions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    scheduledAt: s.scheduledAt.toISOString(),
    durationMin: s.durationMin,
    isLive: s.isLive,
    isEnded: s.isEnded,
    course: {
      id: s.course.id,
      title: s.course.title,
      slug: s.course.slug,
      category: s.course.category,
      thumbnailUrl: s.course.thumbnailUrl,
      instructor: s.course.instructor,
    },
    attendeesCount: s.attendees.length,
    isUserRegistered: userId ? s.attendees.some((a) => a.userId === userId) : false,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* 100% Full-Width Edge-to-Edge Navigation Bar */}
      <MainNav user={session?.user} />

      {/* Main Global Cohorts Hub */}
      <main className="flex-1 w-full">
        <LiveCohortsClient
          sessions={formattedSessions}
          user={session?.user}
        />
      </main>

      {/* Full-Width Footer */}
      <Footer />
    </div>
  );
}
