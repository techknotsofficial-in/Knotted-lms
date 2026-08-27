"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkUserEnrollment } from "@/lib/courses";
import { z } from "zod";

const createLiveSessionSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  scheduledAt: z.string(), // ISO string
  durationMin: z.number().min(15).default(60),
});

export async function createLiveSessionAction(data: z.infer<typeof createLiveSessionSchema>) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to schedule live classes.");
  }

  const validated = createLiveSessionSchema.parse(data);

  // Verify course belongs to this instructor (or user is admin)
  const userRole = (session.user && "role" in session.user ? (session.user.role as string) : "STUDENT")?.toUpperCase();
  const isAdmin = userRole === "ADMIN" || userRole === "STAFF";

  const course = await db.course.findFirst({
    where: isAdmin ? { id: validated.courseId } : { id: validated.courseId, instructorId: session.user.id },
  });

  if (!course) {
    throw new Error("Unauthorized: Course not found or not owned by you.");
  }

  const roomToken = `knotted_room_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

  const liveSession = await db.liveSession.create({
    data: {
      courseId: validated.courseId,
      title: validated.title,
      description: validated.description,
      scheduledAt: new Date(validated.scheduledAt),
      durationMin: validated.durationMin,
      roomToken,
      isLive: true,
    },
  });

  revalidatePath("/creator/live");
  revalidatePath("/live");

  return {
    success: true,
    sessionId: liveSession.id,
    roomToken: liveSession.roomToken,
  };
}

export async function joinLiveSessionAction(sessionId: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Please sign in to join the live session.");
  }

  const userId = session.user.id;

  const liveSession = await db.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        select: { id: true, title: true, slug: true, instructorId: true },
      },
    },
  });

  if (!liveSession) {
    throw new Error("Live session not found.");
  }

  // Auto enroll or verify student is enrolled or is the instructor / admin
  const userRole = (session.user && "role" in session.user ? (session.user.role as string) : "STUDENT")?.toUpperCase();
  const isInstructor = liveSession.course.instructorId === userId || userRole === "ADMIN" || userRole === "STAFF";
  let isEnrolled = isInstructor || (await checkUserEnrollment(userId, liveSession.course.id));

  // If free preview course, auto-enroll student on joining
  if (!isEnrolled) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: liveSession.course.id } },
      update: { status: "ACTIVE" },
      create: { userId, courseId: liveSession.course.id, status: "ACTIVE" },
    });
    isEnrolled = true;
  }

  // Record Attendance in PostgreSQL
  await db.liveAttendee.upsert({
    where: {
      liveSessionId_userId: {
        liveSessionId: sessionId,
        userId,
      },
    },
    update: {
      joinedAt: new Date(),
    },
    create: {
      liveSessionId: sessionId,
      userId,
      joinedAt: new Date(),
    },
  });

  // Award Live Pioneer Badge if student
  if (!isInstructor) {
    const liveBadge = await db.badge.findUnique({
      where: { code: "LIVE_PIONEER" },
    });
    if (liveBadge) {
      await db.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId,
            badgeId: liveBadge.id,
          },
        },
        update: {},
        create: {
          userId,
          badgeId: liveBadge.id,
        },
      });
    }
  }

  // Fetch all real database attendees
  const attendees = await db.liveAttendee.findMany({
    where: { liveSessionId: sessionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  // Fetch existing chat messages
  const messages = await db.liveMessage.findMany({
    where: { liveSessionId: sessionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return {
    success: true,
    liveSession,
    attendees: attendees.map((a) => ({
      id: a.user.id,
      name: a.user.name || a.user.email.split("@")[0],
      email: a.user.email,
      image: a.user.image,
      role: a.user.role,
      joinedAt: a.joinedAt.toISOString(),
    })),
    initialMessages: messages.map((m) => ({
      id: m.id,
      sender: m.user.name || m.user.email.split("@")[0],
      role: m.user.role === "INSTRUCTOR" || m.user.role === "ADMIN" ? ("INSTRUCTOR" as const) : ("STUDENT" as const),
      text: m.text,
      time: m.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })),
    isInstructor,
  };
}

export async function sendLiveChatMessageAction(sessionId: string, text: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) throw new Error("Unauthorized");
  if (!text.trim()) throw new Error("Message cannot be empty");

  const message = await db.liveMessage.create({
    data: {
      liveSessionId: sessionId,
      userId: session.user.id,
      text: text.trim(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return {
    success: true,
    message: {
      id: message.id,
      sender: message.user.name || message.user.email.split("@")[0],
      role: message.user.role === "INSTRUCTOR" || message.user.role === "ADMIN" ? ("INSTRUCTOR" as const) : ("STUDENT" as const),
      text: message.text,
      time: message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  };
}

export async function getLiveSessionStateAction(sessionId: string) {
  const [session, attendees, messages] = await Promise.all([
    db.liveSession.findUnique({
      where: { id: sessionId },
      select: { isLive: true, isEnded: true },
    }),
    db.liveAttendee.findMany({
      where: { liveSessionId: sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
    db.liveMessage.findMany({
      where: { liveSessionId: sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
  ]);

  return {
    isLive: session?.isLive ?? false,
    isEnded: session?.isEnded ?? false,
    attendees: attendees.map((a) => ({
      id: a.user.id,
      name: a.user.name || a.user.email.split("@")[0],
      email: a.user.email,
      image: a.user.image,
      role: a.user.role,
      joinedAt: a.joinedAt.toISOString(),
    })),
    messages: messages.map((m) => ({
      id: m.id,
      sender: m.user.name || m.user.email.split("@")[0],
      role: m.user.role === "INSTRUCTOR" || m.user.role === "ADMIN" ? ("INSTRUCTOR" as const) : ("STUDENT" as const),
      text: m.text,
      time: m.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })),
  };
}

export async function rsvpLiveSessionAction(sessionId: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Please sign in to register for live cohort sessions.");
  }

  const liveSession = await db.liveSession.findUnique({
    where: { id: sessionId },
    include: { course: { select: { id: true, title: true } } },
  });

  if (!liveSession) throw new Error("Live cohort session not found.");

  // Auto-register attendance in advance
  await db.liveAttendee.upsert({
    where: {
      liveSessionId_userId: {
        liveSessionId: sessionId,
        userId: session.user.id,
      },
    },
    update: {},
    create: {
      liveSessionId: sessionId,
      userId: session.user.id,
    },
  });

  // Auto-enroll user into course if free
  await db.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId: liveSession.course.id } },
    update: { status: "ACTIVE" },
    create: { userId: session.user.id, courseId: liveSession.course.id, status: "ACTIVE" },
  });

  revalidatePath("/live");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function startLiveBroadcastAction(sessionId: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) throw new Error("Unauthorized");

  await db.liveSession.update({
    where: { id: sessionId },
    data: { isLive: true, isEnded: false },
  });

  revalidatePath("/creator/live");
  revalidatePath("/live");

  return { success: true };
}

export async function endLiveSessionAction(sessionId: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await db.liveSession.update({
    where: { id: sessionId },
    data: {
      isLive: false,
      isEnded: true,
    },
  });

  revalidatePath("/creator/live");
  revalidatePath("/live");

  return { success: true };
}

export async function sendLiveSignalAction(
  sessionId: string,
  receiverId: string | null,
  type: string,
  payload: string
) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) throw new Error("Unauthorized");

  const signal = await db.liveSignal.create({
    data: {
      liveSessionId: sessionId,
      senderId: session.user.id,
      receiverId: receiverId,
      type,
      payload,
    },
  });

  return { success: true, signalId: signal.id };
}

export async function getLiveSignalsAction(sessionId: string, afterSignalId?: string | null) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) throw new Error("Unauthorized");

  const currentUserId = session.user.id;

  // Use cursor-based pagination (by ID) to never miss signals regardless of clock skew
  const signals = await db.liveSignal.findMany({
    where: {
      liveSessionId: sessionId,
      senderId: { not: currentUserId },
      OR: [
        { receiverId: currentUserId },
        { receiverId: null },
      ],
      ...(afterSignalId ? { id: { gt: afterSignalId } } : { createdAt: { gt: new Date(Date.now() - 30000) } }),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return {
    signals: signals.map((s) => ({
      id: s.id,
      senderId: s.senderId,
      receiverId: s.receiverId,
      type: s.type,
      payload: s.payload,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}

export async function leaveLiveSessionAction(sessionId: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) return { success: false };

  try {
    // 1. Send leave signal to all active peers
    await db.liveSignal.create({
      data: {
        liveSessionId: sessionId,
        senderId: session.user.id,
        receiverId: null,
        type: "leave",
        payload: JSON.stringify({ name: session.user.name || session.user.email }),
      },
    });

    // 2. Remove attendee record
    await db.liveAttendee.deleteMany({
      where: {
        liveSessionId: sessionId,
        userId: session.user.id,
      },
    });
  } catch {}

  return { success: true };
}
