"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function getAuthenticatedUser() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to manage your profile.");
  }
  return session.user;
}

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  image: z.string().optional().nullable(),
});

export async function updateUserProfileAction(data: z.infer<typeof updateProfileSchema>) {
  const user = await getAuthenticatedUser();
  const validated = updateProfileSchema.parse(data);

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      name: validated.name.trim(),
      image: validated.image || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/");

  return {
    success: true,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      role: updated.role,
    },
  };
}

export async function deleteUserAccountAction() {
  const user = await getAuthenticatedUser();

  // Cascade delete user and all associated enrollments, sessions, progress
  await db.user.delete({
    where: { id: user.id },
  });

  return { success: true };
}
