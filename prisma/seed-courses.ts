import { PrismaClient, CourseLevel, LessonType } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Publishing courses and seeding technical masterclasses...");

  // 1. Publish all existing user courses
  const published = await db.course.updateMany({
    data: { isPublished: true },
  });
  console.log(`✅ Set ${published.count} existing course(s) to isPublished: true.`);

  // Find an admin user to author the curated masterclasses
  const instructor = await db.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!instructor) {
    console.log("⚠️ No admin instructor found, skipping new masterclasses creation.");
    return;
  }

  // 2. Curated Technical Masterclasses across categories
  const masterclasses = [
    {
      title: "Enterprise Next.js 16 & Server Architecture",
      slug: "enterprise-nextjs-16-server-architecture",
      subtitle: "Turbopack, Server Actions, Dynamic Streaming & Edge Proxies",
      description:
        "Master the bleeding-edge features of Next.js 16 with Turbopack, React Server Components (RSC), asynchronous proxy middleware, and sub-millisecond Postgres connection pooling.",
      category: "Full-Stack Development",
      level: CourseLevel.ADVANCED,
      price: 0, // Free
      thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
      instructorId: instructor.id,
      isPublished: true,
      chapters: [
        {
          title: "Architecture & Foundations",
          lessons: [
            {
              title: "Next.js 16 Architectural Shifts & Server Components",
              slug: "nextjs-16-architectural-shifts",
              type: LessonType.VIDEO,
              durationSec: 840,
              isFree: true,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              content: "An in-depth breakdown of React Server Components, Turbopack compiling, and cache invalidation.",
            },
            {
              title: "Zero-Egress Asset Streaming Pipeline",
              slug: "zero-egress-asset-streaming-pipeline",
              type: LessonType.VIDEO,
              durationSec: 1120,
              isFree: false,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              content: "Implementing presigned URL generation and direct client-to-R2 upload pipelines.",
            },
          ],
        },
      ],
    },
    {
      title: "Cloudflare R2 & Edge Storage Mastery",
      slug: "cloudflare-r2-edge-storage-mastery",
      subtitle: "Zero-Egress Multi-Region Video Delivery & S3 Compatibility",
      description:
        "Eliminate cloud egress taxes forever. Learn how to architect multi-terabyte media streaming pipelines using Cloudflare R2, AWS SDK S3 presigners, and custom domains.",
      category: "Cloud Architecture",
      level: CourseLevel.INTERMEDIATE,
      price: 4999, // ₹49.99
      thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
      instructorId: instructor.id,
      isPublished: true,
      chapters: [
        {
          title: "Cloudflare R2 Infrastructure Setup",
          lessons: [
            {
              title: "Creating S3-Compatible Buckets on Cloudflare",
              slug: "creating-s3-compatible-buckets",
              type: LessonType.VIDEO,
              durationSec: 720,
              isFree: true,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              content: "Setting up API tokens, bucket permissions, and cross-origin resource sharing (CORS).",
            },
          ],
        },
      ],
    },
    {
      title: "Edge Security, WAF & Anti-Piracy DRM",
      slug: "edge-security-waf-anti-piracy-drm",
      subtitle: "Arcjet Rate Limiting, Bot Defense & Canvas Watermarking",
      description:
        "Protect your enterprise web applications from credential stuffing, DDOS attacks, and media scraping with Arcjet security shields and dynamic floating user watermarks.",
      category: "Edge Security",
      level: CourseLevel.ADVANCED,
      price: 7999, // ₹79.99
      thumbnailUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80",
      instructorId: instructor.id,
      isPublished: true,
      chapters: [
        {
          title: "WAF & Bot Shielding",
          lessons: [
            {
              title: "Deploying Arcjet Middleware & Shield Analysis",
              slug: "deploying-arcjet-middleware",
              type: LessonType.VIDEO,
              durationSec: 960,
              isFree: true,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
              content: "Configuring sliding window rate limits and disposable email blocking.",
            },
          ],
        },
      ],
    },
    {
      title: "High-Performance Design Systems with Tailwind & Motion",
      slug: "high-performance-design-systems",
      subtitle: "Crafting Accessible, Fluid Interfaces with Watermelon UI Patterns",
      description:
        "Build world-class design systems with modern typography, smooth micro-interactions, responsive typography, and accessible component architectures.",
      category: "UI/UX Engineering",
      level: CourseLevel.BEGINNER,
      price: 0, // Free
      thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80",
      instructorId: instructor.id,
      isPublished: true,
      chapters: [
        {
          title: "Design System Fundamentals",
          lessons: [
            {
              title: "Building Reusable Component Primitives",
              slug: "building-reusable-component-primitives",
              type: LessonType.VIDEO,
              durationSec: 650,
              isFree: true,
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
              content: "Crafting badges, buttons, and responsive layouts with semantic HTML and CSS variables.",
            },
          ],
        },
      ],
    },
  ];

  for (const mc of masterclasses) {
    const existing = await db.course.findUnique({
      where: { slug: mc.slug },
    });

    if (!existing) {
      await db.course.create({
        data: {
          title: mc.title,
          slug: mc.slug,
          subtitle: mc.subtitle,
          description: mc.description,
          category: mc.category,
          level: mc.level,
          price: mc.price,
          thumbnailUrl: mc.thumbnailUrl,
          instructorId: mc.instructorId,
          isPublished: true,
          chapters: {
            create: mc.chapters.map((ch, chIdx) => ({
              title: ch.title,
              sortOrder: chIdx,
              lessons: {
                create: ch.lessons.map((l, lIdx) => ({
                  title: l.title,
                  slug: l.slug,
                  type: l.type,
                  durationSec: l.durationSec,
                  isFree: l.isFree,
                  videoUrl: l.videoUrl,
                  content: l.content,
                  sortOrder: lIdx,
                })),
              },
            })),
          },
        },
      });
      console.log(`✨ Created masterclass: "${mc.title}"`);
    }
  }

  console.log("🎉 All courses published and catalog seeded successfully!");
}

main().finally(async () => {
  await db.$disconnect();
});
