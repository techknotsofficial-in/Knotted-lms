import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSignedPlaybackUrl } from "@/lib/storage";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";
import { ProfileClient } from "./profile-client";

function extractR2Key(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  if (urlOrKey.startsWith("user_avatar/") || urlOrKey.startsWith("course_thumbnail/")) {
    return urlOrKey;
  }
  const match = urlOrKey.match(/(user_avatar\/[^\s?#]+)/);
  if (match) return match[1];
  return null;
}

export default async function ProfilePage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/login?redirect=/profile");
  }

  // Fetch full user and aggregated stats concurrently
  const [userRecord, enrollmentsCount, completedCount, badgesCount, certificatesCount] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
      },
    }),
    db.enrollment.count({ where: { userId: session.user.id } }),
    db.userProgress.count({ where: { userId: session.user.id, isCompleted: true } }),
    db.userBadge.count({ where: { userId: session.user.id } }),
    db.certificate.count({ where: { userId: session.user.id } }),
  ]);

  if (!userRecord) {
    redirect("/login");
  }

  // Resolve private Cloudflare R2 avatar to signed image URL
  let resolvedImage = userRecord.image;
  const r2Key = extractR2Key(userRecord.image);
  if (r2Key) {
    try {
      resolvedImage = await getSignedPlaybackUrl(r2Key, 86400); // 24-hour signed image token
    } catch (err) {
      console.warn("Failed to sign avatar URL:", err);
    }
  }

  const userWithResolvedImage = {
    ...userRecord,
    image: resolvedImage,
    createdAt: userRecord.createdAt.toISOString(),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* Full-Width Main Navigation Bar */}
      <MainNav user={userWithResolvedImage} />

      {/* Main Profile Studio */}
      <main className="flex-1 w-full">
        <ProfileClient
          user={userWithResolvedImage}
          stats={{
            enrollmentsCount,
            completedCount,
            badgesCount,
            certificatesCount,
          }}
        />
      </main>

      {/* Full-Width Footer */}
      <Footer />
    </div>
  );
}
