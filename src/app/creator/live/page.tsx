import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";
import { CreatorLiveClient } from "./creator-live-client";

export default async function CreatorLivePage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/login?redirect=/creator/live");
  }

  const userRole = (session.user && "role" in session.user ? (session.user.role as string) : "STUDENT")?.toUpperCase();
  const isStaffOrAdmin = userRole === "ADMIN" || userRole === "STAFF" || userRole === "INSTRUCTOR";

  if (!isStaffOrAdmin) {
    redirect("/dashboard?error=unauthorized_creator_access");
  }

  // Fetch courses available for live sessions
  const [courses, liveSessions] = await Promise.all([
    db.course.findMany({
      where: userRole === "ADMIN" ? {} : { instructorId: session.user.id },
      select: {
        id: true,
        title: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.liveSession.findMany({
      where: userRole === "ADMIN" ? {} : { course: { instructorId: session.user.id } },
      include: {
        course: { select: { title: true, slug: true } },
        attendees: { select: { id: true } },
      },
      orderBy: { scheduledAt: "desc" },
    }),
  ]);

  const formattedSessions = liveSessions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    scheduledAt: s.scheduledAt.toISOString(),
    durationMin: s.durationMin,
    isLive: s.isLive,
    isEnded: s.isEnded,
    course: s.course,
    attendeesCount: s.attendees.length,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* 100% Full-Width Main Navigation Bar */}
      <MainNav user={session.user} />

      {/* Creator Studio Live Scheduler */}
      <main className="flex-1 w-full">
        <CreatorLiveClient
          courses={courses}
          existingSessions={formattedSessions}
        />
      </main>

      {/* Full-Width Footer */}
      <Footer />
    </div>
  );
}
