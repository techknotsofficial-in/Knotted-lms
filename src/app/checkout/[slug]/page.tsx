import React from "react";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getCourseBySlug, checkUserEnrollment } from "@/lib/courses";
import { auth } from "@/lib/auth";
import { CheckoutClient } from "./checkout-client";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect(`/login?redirect=/checkout/${slug}`);
  }

  // If already enrolled, go straight to classroom
  const isEnrolled = await checkUserEnrollment(session.user.id, course.id);
  if (isEnrolled) {
    redirect(`/learn/${slug}`);
  }

  return <CheckoutClient course={course} user={session.user} />;
}
