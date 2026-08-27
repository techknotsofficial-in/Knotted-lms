import { PrismaClient, CourseLevel, LessonType } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Find an admin/instructor
  const instructor = await db.user.findFirst({
    where: { role: { in: ["ADMIN", "INSTRUCTOR"] } },
  });

  if (!instructor) {
    console.error("No instructor found to author courses.");
    return;
  }

  const instructorId = instructor.id;

  // 1. AI Agents & Multi-Agent Orchestration Bootcamp
  const aiCourse = await db.course.upsert({
    where: { slug: "ai-agents-langgraph-orchestration" },
    update: { isPublished: true },
    create: {
      title: "AI Agents & Autonomous Multi-Agent Orchestration Bootcamp",
      slug: "ai-agents-langgraph-orchestration",
      subtitle: "Build production-grade autonomous agent systems with LangGraph, tool calling, and human-in-the-loop validation.",
      description: "Master autonomous AI agent design patterns. Learn multi-agent state machines, memory architectures, structured tool calling, and resilient production deployment.",
      thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80",
      price: 3499,
      currency: "INR",
      level: CourseLevel.ADVANCED,
      isPublished: true,
      category: "Artificial Intelligence",
      instructorId,
      chapters: {
        create: [
          {
            title: "Module 1: Agent State & Decision Graphs",
            sortOrder: 0,
            isPublished: true,
            lessons: {
              create: [
                {
                  title: "Introduction to Multi-Agent Architectures",
                  slug: "intro-multi-agent-architectures",
                  type: LessonType.TEXT,
                  content: "Welcome to AI Agents & Multi-Agent Orchestration. In this module, we dissect modern autonomous loops, supervisor patterns, and tool-calling execution pipelines.",
                  durationSec: 620,
                  sortOrder: 0,
                  isFree: true,
                  isPublished: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 2. High-Throughput Distributed Systems with Go & gRPC
  const distributedCourse = await db.course.upsert({
    where: { slug: "distributed-systems-go-grpc" },
    update: { isPublished: true },
    create: {
      title: "High-Throughput Distributed Systems with Go & gRPC",
      slug: "distributed-systems-go-grpc",
      subtitle: "Design fault-tolerant microservices, Raft consensus nodes, and ultra-low latency gRPC services in Go.",
      description: "A deep dive into distributed consensus, event-driven architectures with Kafka, protobuf serialization, and horizontal scaling strategies for modern infrastructure.",
      thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80",
      price: 4999,
      currency: "INR",
      level: CourseLevel.INTERMEDIATE,
      isPublished: true,
      category: "Distributed Systems",
      instructorId,
      chapters: {
        create: [
          {
            title: "Module 1: Distributed Foundations & Consensus",
            sortOrder: 0,
            isPublished: true,
            lessons: {
              create: [
                {
                  title: "Consensus Algorithms & CAP Theorem in Practice",
                  slug: "consensus-cap-theorem",
                  type: LessonType.TEXT,
                  content: "Learn the mathematical foundations of distributed consensus, split-brain mitigation, and high-performance RPC protocols.",
                  durationSec: 740,
                  sortOrder: 0,
                  isFree: true,
                  isPublished: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("✅ Seeded real technical masterclasses:", aiCourse.title, distributedCourse.title);
}

main().finally(async () => {
  await db.$disconnect();
});
