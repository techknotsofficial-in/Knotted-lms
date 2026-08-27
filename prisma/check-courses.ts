import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const courses = await db.course.findMany();
  console.log("Existing courses:", courses.map(c => ({ id: c.id, title: c.title, slug: c.slug, isPublished: c.isPublished })));
}

main().finally(async () => {
  await db.$disconnect();
});
