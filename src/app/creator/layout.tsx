import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/login?redirect=/creator/courses");
  }

  // Fetch full user record to inspect database role
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const role = (user?.role || "STUDENT").toUpperCase();
  const isAllowed = role === "ADMIN" || role === "STAFF" || role === "INSTRUCTOR";

  // RBAC Guard: If user is a student, deny access and redirect to dashboard
  if (!isAllowed) {
    redirect("/dashboard?error=unauthorized_creator_access");
  }

  return <>{children}</>;
}
