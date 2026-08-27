import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Initializing core system definitions...");

  // System Badge Definitions (No fake users, no fake courses)
  const systemBadges = [
    {
      code: "FIRST_KNOT",
      title: "First Knot Tied",
      description: "Completed your very first lesson on Knotted.",
      iconName: "Sparkles",
      rarity: "COMMON",
    },
    {
      code: "SPEED_LEARNER",
      title: "Swift Weaver",
      description: "Completed 5 lessons in a single 24-hour window.",
      iconName: "Zap",
      rarity: "RARE",
    },
    {
      code: "MASTER_KNOT",
      title: "Master of Knots",
      description: "Completed 100% of a comprehensive course curriculum.",
      iconName: "Award",
      rarity: "EPIC",
    },
    {
      code: "LIVE_PIONEER",
      title: "Live Pioneer",
      description: "Attended and actively engaged in a live cohort session.",
      iconName: "Video",
      rarity: "RARE",
    },
  ];

  for (const badge of systemBadges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
  }

  console.log("✅ Core system badges initialized.");
}

main()
  .catch((e) => {
    console.error("❌ Initialization error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
