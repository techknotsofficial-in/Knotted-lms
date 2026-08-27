import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    include: {
      instructor: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      chapters: {
        include: {
          lessons: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${courses.length} published courses:`);
  courses.forEach((c) => {
    console.log(`- [${c.id}] ${c.title} (${c.slug}) | Price: ₹${c.price} | Category: ${c.category} | Thumbnail: ${c.thumbnailUrl?.slice(0, 40)}...`);
  });
}

main().finally(async () => {
  await db.$disconnect();
});
