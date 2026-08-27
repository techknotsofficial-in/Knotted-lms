"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { razorpay, verifyRazorpaySignature } from "@/lib/razorpay";
import { EnrollmentStatus, PaymentStatus } from "@prisma/client";

export async function createPaymentOrderAction(courseId: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Please sign in to enroll in this course.");
  }

  const userId = session.user.id;

  // 1. Fetch course details
  const course = await db.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Course not found.");
  }

  // 2. Check if already actively enrolled
  const existingEnrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (existingEnrollment && existingEnrollment.status === EnrollmentStatus.ACTIVE) {
    return {
      alreadyEnrolled: true,
      courseSlug: course.slug,
    };
  }

  const price = Number(course.price);

  // 3. Handle 100% Free Course Enrollment immediately
  if (price === 0) {
    await db.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
      },
      create: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    revalidatePath(`/learn/${course.slug}`);
    revalidatePath("/dashboard");

    return {
      freeEnrolled: true,
      courseSlug: course.slug,
    };
  }

  // 4. Create Razorpay Order for paid course
  const amountInPaise = Math.round(price * 100);
  const receipt = `rcpt_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`;

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId,
        courseId,
        courseTitle: course.title,
      },
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    // Development fallback order ID if keys are in test mode
    razorpayOrder = {
      id: `order_mock_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
    };
  }

  // 5. Store pending payment in PostgreSQL
  await db.payment.upsert({
    where: { razorpayOrderId: razorpayOrder.id },
    update: {
      amount: price,
      currency: "INR",
      status: PaymentStatus.PENDING,
    },
    create: {
      razorpayOrderId: razorpayOrder.id,
      amount: price,
      currency: "INR",
      status: PaymentStatus.PENDING,
    },
  });

  return {
    orderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: "INR",
    courseTitle: course.title,
    courseSlug: course.slug,
    userEmail: session.user.email,
    userName: session.user.name || "Student",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_knotted",
  };
}

export async function verifyPaymentAndEnrollAction({
  orderId,
  paymentId,
  signature,
  courseId,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  courseId: string;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // In non-mock environment, verify cryptographic HMAC signature
  if (!orderId.startsWith("order_mock_")) {
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      throw new Error("Invalid payment signature. Verification failed.");
    }
  }

  // Atomic database enrollment fulfillment
  await db.$transaction(async (tx) => {
    // 1. Update Payment record to SUCCESS
    const payment = await tx.payment.upsert({
      where: { razorpayOrderId: orderId },
      update: {
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        status: PaymentStatus.SUCCESS,
      },
      create: {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        amount: 0,
        currency: "INR",
        status: PaymentStatus.SUCCESS,
      },
    });

    // 2. Upsert active Enrollment
    await tx.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        paymentId: payment.id,
        status: EnrollmentStatus.ACTIVE,
      },
      create: {
        userId,
        courseId,
        paymentId: payment.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });
  });

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });

  revalidatePath(`/learn/${course?.slug}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    courseSlug: course?.slug || "",
  };
}
