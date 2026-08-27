import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { PaymentStatus, EnrollmentStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // 1. Verify Cryptographic Webhook Signature
    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const eventType = payload.event;

    // 2. Idempotency Guard (Prevent duplicate processing of webhook retries)
    const existingLog = await db.webhookLog.findUnique({
      where: { eventId },
    });

    if (existingLog && existingLog.processed) {
      return NextResponse.json({
        received: true,
        message: "Event already processed (idempotent)",
      });
    }

    // 3. Process payment events
    if (eventType === "order.paid" || eventType === "payment.captured") {
      const paymentEntity =
        payload.payload?.payment?.entity || payload.payload?.order?.entity;
      const orderId = paymentEntity?.order_id || paymentEntity?.id;
      const paymentId = paymentEntity?.id;
      const notes = paymentEntity?.notes || {};
      const { userId, courseId } = notes;

      if (orderId) {
        await db.$transaction(async (tx) => {
          // Update payment status
          const payment = await tx.payment.upsert({
            where: { razorpayOrderId: orderId },
            update: {
              razorpayPaymentId: paymentId,
              status: PaymentStatus.SUCCESS,
            },
            create: {
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              amount: (paymentEntity?.amount || 0) / 100,
              currency: paymentEntity?.currency || "INR",
              status: PaymentStatus.SUCCESS,
            },
          });

          // Ensure Enrollment is active
          if (userId && courseId) {
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
          }
        });
      }
    }

    // 4. Record Webhook Log in PostgreSQL
    await db.webhookLog.upsert({
      where: { eventId },
      update: {
        processed: true,
        payload,
      },
      create: {
        eventId,
        provider: "RAZORPAY",
        event: eventType || "unknown",
        payload,
        processed: true,
      },
    });

    return NextResponse.json({ success: true, received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook processing error";
    console.error("Razorpay webhook processing failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
