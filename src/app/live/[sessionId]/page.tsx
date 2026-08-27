import React from "react";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { joinLiveSessionAction } from "@/actions/live";
import { LiveRoomClient } from "./live-room-client";

interface LiveSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function LiveSessionPage({ params }: LiveSessionPageProps) {
  const { sessionId } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect(`/login?redirect=/live/${sessionId}`);
  }

  let joinResult;
  try {
    joinResult = await joinLiveSessionAction(sessionId);
  } catch (err: unknown) {
    console.error("Failed to join live session:", err);
    notFound();
  }

  const { liveSession, attendees, initialMessages, isInstructor } = joinResult;

  const formattedSession = {
    id: liveSession.id,
    title: liveSession.title,
    description: liveSession.description,
    roomToken: liveSession.roomToken,
    isLive: liveSession.isLive,
    durationMin: liveSession.durationMin,
    course: {
      title: liveSession.course.title,
      slug: liveSession.course.slug || "course",
    },
  };

  return (
    <LiveRoomClient
      session={formattedSession}
      attendees={attendees || []}
      initialMessages={initialMessages || []}
      user={session.user}
      isInstructor={isInstructor}
    />
  );
}
