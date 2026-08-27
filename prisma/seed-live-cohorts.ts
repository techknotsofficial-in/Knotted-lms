import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    include: { instructor: true },
  });

  if (courses.length === 0) {
    console.error("No published courses found to attach live sessions.");
    return;
  }

  const course1 = courses[0];
  const course2 = courses[1] || courses[0];
  const course3 = courses[2] || courses[0];

  // 1. Live Now Session
  const session1 = await db.liveSession.upsert({
    where: { roomToken: "knotted-live-global-arch-01" },
    update: { isLive: true, isEnded: false },
    create: {
      courseId: course1.id,
      title: `Global Masterclass Cohort: ${course1.title} Live Code Teardown`,
      description: "Interactive real-time architectural walkthrough, live benchmark testing, and Q&A with learners from around the world.",
      scheduledAt: new Date(Date.now() - 1000 * 60 * 15), // Started 15 mins ago
      durationMin: 90,
      roomToken: "knotted-live-global-arch-01",
      isLive: true,
      isEnded: false,
    },
  });

  // 2. Scheduled Tomorrow Session
  const session2 = await db.liveSession.upsert({
    where: { roomToken: "knotted-live-ai-agents-02" },
    update: { isLive: false, isEnded: false },
    create: {
      courseId: course2.id,
      title: `Live Workshop: ${course2.title} — Real-Time Production Build`,
      description: "Step-by-step interactive cohort build session. Learn best practices and participate in live peer coding exercises.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
      durationMin: 120,
      roomToken: "knotted-live-ai-agents-02",
      isLive: false,
      isEnded: false,
    },
  });

  // 3. Scheduled Weekend Session
  const session3 = await db.liveSession.upsert({
    where: { roomToken: "knotted-live-distributed-03" },
    update: { isLive: false, isEnded: false },
    create: {
      courseId: course3.id,
      title: `Cohort Workshop: ${course3.title} — Global AMA & System Design`,
      description: "Ask anything about scalable distributed systems and high-throughput server pipelines with international attendees.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 72), // 3 days later
      durationMin: 60,
      roomToken: "knotted-live-distributed-03",
      isLive: false,
      isEnded: false,
    },
  });

  console.log("✅ Seeded Global Live Cohort Sessions:", session1.title, session2.title, session3.title);
}

main().finally(async () => {
  await db.$disconnect();
});
