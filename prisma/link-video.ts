import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const videoKey = "lesson_video/z7X11RJ8VvmE9dBMDe48TAKefi5WkZKY/1787729481582-What_is_a_Server__Servers_vs_Desktops_Explained.mp4";

  const updated = await db.lesson.updateMany({
    where: {
      chapter: {
        course: {
          slug: "server-foundation-0183",
        },
      },
    },
    data: {
      videoUrl: videoKey,
      durationSec: 428,
    },
  });

  console.log(`✅ Updated ${updated.count} lesson(s) with Cloudflare R2 video key: ${videoKey}`);
}

main().finally(async () => {
  await db.$disconnect();
});
