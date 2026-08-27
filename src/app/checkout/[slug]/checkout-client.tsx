"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  createPaymentOrderAction,
  verifyPaymentAndEnrollAction,
} from "@/actions/payments";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Loader2,
  Sparkles,
  CreditCard,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CheckoutClientProps {
  course: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    price: number;
    currency: string;
    category: string;
    thumbnailUrl: string | null;
    instructor: {
      name: string | null;
    };
    chapters: { id: string; lessons: { id: string }[] }[];
  };
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export function CheckoutClient({ course, user }: CheckoutClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalLessons = course.chapters.flatMap((c) => c.lessons).length;
  const isFree = course.price === 0;

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      // 1. Create order on server
      const orderRes = await createPaymentOrderAction(course.id);

      if (orderRes.alreadyEnrolled || orderRes.freeEnrolled) {
        router.push(`/learn/${course.slug}`);
        router.refresh();
        return;
      }

      // 2. Launch Razorpay Checkout Modal
      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Knotted LMS",
        description: `Enrollment for ${course.title}`,
        order_id: orderRes.orderId,
        prefill: {
          name: user.name || "Student",
          email: user.email,
        },
        theme: {
          color: "#09090B",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            const verifyRes = await verifyPaymentAndEnrollAction({
              orderId: response.razorpay_order_id || orderRes.orderId,
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              signature: response.razorpay_signature || "test_signature",
              courseId: course.id,
            });

            if (verifyRes.success) {
              router.push(`/learn/${course.slug}`);
              router.refresh();
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Verification failed";
            setError(msg);
          }
        },
      };

      if (typeof window !== "undefined" && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for development test mode without live script
        if (orderRes.orderId) {
          const verifyRes = await verifyPaymentAndEnrollAction({
            orderId: orderRes.orderId,
            paymentId: `pay_mock_${Date.now()}`,
            signature: "mock_signature",
            courseId: course.id,
          });
          if (verifyRes.success) {
            router.push(`/learn/${course.slug}`);
            router.refresh();
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate payment";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
        {/* Top Minimal Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#E4E4E7]">
          <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold">
                <Link href={`/courses/${course.slug}`}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Course Details
                </Link>
              </Button>
              <Logo size="default" />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#71717A]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>256-Bit Encrypted Checkout</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-8 w-full">
          <div className="text-center space-y-2">
            <Badge variant="mint" className="text-xs uppercase font-bold">Secure Enrollment</Badge>
            <h1 className="text-3xl font-extrabold text-[#09090B] font-sans tracking-tight">
              Complete Your Registration
            </h1>
            <p className="text-xs sm:text-sm text-[#71717A]">
              Unlock instant lifetime access to the curriculum, HD video lectures, and certificates.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            {/* Left: Course Summary Card */}
            <div className="md:col-span-3 rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs space-y-6">
              <div className="space-y-2">
                <Badge variant="mint" className="text-[10px] uppercase font-bold">{course.category}</Badge>
                <h2 className="text-xl font-bold text-[#09090B] font-sans">
                  {course.title}
                </h2>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  {course.subtitle || "Full lifetime access with all future curriculum updates."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <Layers className="w-4 h-4 text-[#09090B]" />
                <span>{course.chapters.length} Modules • {totalLessons} High-Definition Lessons</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7] space-y-2 text-xs">
                <p className="font-bold text-[#09090B]">Included in this Masterclass:</p>
                <ul className="space-y-1.5 text-[#71717A]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instant ultra-HD video streaming</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Interactive live cohort sessions & Q&A</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Verifiable completion certificate</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 text-xs text-[#71717A]">
                Enrolling as: <strong className="text-[#09090B]">{user.name || user.email}</strong> ({user.email})
              </div>
            </div>

            {/* Right: Payment & Action Card */}
            <div className="md:col-span-2 rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#09090B]">
                  Order Summary
                </h3>

                <div className="space-y-2 py-3 border-y border-[#F4F4F5] text-xs">
                  <div className="flex items-center justify-between text-[#71717A]">
                    <span>Masterclass Price</span>
                    <span className="font-mono text-[#09090B] font-bold">
                      {isFree ? "Free" : formatCurrency(course.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#71717A]">
                    <span>Taxes & Processing</span>
                    <span className="font-mono text-[#09090B]">₹0.00</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-sm font-bold text-[#09090B]">Total Amount:</span>
                  <span className="text-2xl font-extrabold text-[#09090B] font-mono">
                    {isFree ? "Free" : formatCurrency(course.price)}
                  </span>
                </div>
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#09090B] hover:bg-[#27272A] text-white font-bold text-sm h-12 rounded-2xl shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Securing Enrollment...
                  </>
                ) : isFree ? (
                  <>
                    <span>Confirm Free Enrollment</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span>Pay {formatCurrency(course.price)}</span>
                  </>
                )}
              </Button>

              <p className="text-[11px] text-[#A1A1AA] text-center leading-tight">
                By completing enrollment, you gain immediate access to all curriculum modules and verifiable credentials.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
