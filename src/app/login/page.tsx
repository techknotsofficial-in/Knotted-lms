"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Badge24 } from "@/components/ui/badge-24";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  Quote,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const testimonials = [
  {
    quote:
      "Their platform transformed how our engineering team masters complex architectures. The zero-egress video streaming is instant with zero buffering, and the interactive classrooms reinforced our confidence in moving forward.",
    author: "Sean Quinn",
    role: "Founder & Lead Architect at TimeKeeper",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "Knotted's anti-piracy watermarking and drag-and-drop curriculum builder allowed our academy to launch 8 enterprise cohort masterclasses with zero security leaks.",
    author: "Elena Rostova",
    role: "Head of Engineering Education",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "The combination of Better Auth OTP and verifiable certificates makes Knotted the cleanest learning management system our team has ever experienced.",
    author: "Marcus Vance",
    role: "VP of Product, CloudScale Systems",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
];

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"form" | "otp">("form");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotate testimonials every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP for Sign In or Sign Up
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please provide a valid email address");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setError("Please provide your full name");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: cleanEmail,
        type: "sign-in",
      });

      if (res.error) {
        setError(res.error.message || "Failed to send verification code");
      } else {
        setStep("otp");
        setResendCooldown(60);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify 6-Digit OTP Code
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedOtp = otp.trim().replace(/\D/g, "");
    if (cleanedOtp.length < 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: cleanedOtp,
      });

      if (res.error) {
        setError(res.error.message || "Invalid or expired verification code");
      } else {
        const isOnboarded = typeof window !== "undefined" && localStorage.getItem("knotted_onboarding_completed") === "true";
        if (mode === "signup" || !isOnboarded) {
          router.push("/onboarding");
        } else {
          router.push(redirectUrl);
        }
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const currentT = testimonials[activeTestimonial];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAFA] text-[#09090B] p-4 sm:p-8 md:p-12">
      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <Logo size="default" />
        <Button variant="outline" size="sm" asChild className="text-xs font-semibold">
          <Link href="/courses">
            Explore Courses
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </header>

      {/* Main Two-Column Split Card */}
      <main className="max-w-5xl mx-auto w-full my-auto py-6">
        <div className="rounded-3xl border border-[#E4E4E7] bg-white shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Column: Testimonial & Credibility Carousel */}
          <div className="lg:col-span-5 bg-[#F4F4F5] border-b lg:border-b-0 lg:border-r border-[#E4E4E7] p-8 md:p-10 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Quote Icon */}
              <div className="text-[#09090B]">
                <Quote className="w-10 h-10 rotate-180 fill-[#09090B]" />
              </div>

              {/* Quote Body */}
              <p className="text-base md:text-lg font-medium text-[#18181B] leading-relaxed transition-all duration-300 min-h-[140px]">
                &ldquo;{currentT.quote}&rdquo;
              </p>

              {/* Author & Avatar */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E4E4E7] bg-white shrink-0">
                  <Image
                    src={currentT.avatar}
                    alt={currentT.author}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#09090B]">{currentT.author}</h4>
                  <p className="text-xs text-[#71717A]">{currentT.role}</p>
                </div>
              </div>
            </div>

            {/* Bottom Slider Progress Bars */}
            <div className="flex items-center gap-2 pt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTestimonial(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeTestimonial === idx
                      ? "w-10 bg-[#09090B]"
                      : "w-6 bg-[#D4D4D8] hover:bg-[#A1A1AA]"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Login & Sign Up Form */}
          <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-between space-y-6">
            <div>
              {/* Mode Switcher Tabs */}
              <div className="flex items-center justify-between pb-6 border-b border-[#F4F4F5] mb-6">
                <div className="inline-flex p-1 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setStep("form");
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mode === "signin"
                        ? "bg-[#09090B] text-white shadow-xs"
                        : "text-[#71717A] hover:text-[#09090B]"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setStep("form");
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mode === "signup"
                        ? "bg-[#09090B] text-white shadow-xs"
                        : "text-[#71717A] hover:text-[#09090B]"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <Badge24 variant="success" pulse={true} className="hidden sm:inline-flex text-[10px]">
                  Passwordless OTP
                </Badge24>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {step === "form" ? (
                /* Step 1: User Details Form */
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  {mode === "signup" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#09090B]">
                          Full name
                        </label>
                        <Input
                          placeholder="Your name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-[#F4F4F5] border-[#E4E4E7] focus:bg-white text-sm h-12 rounded-xl"
                          required={mode === "signup"}
                        />
                      </div>

                      {/* Company / Organization */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#09090B]">
                          Your company
                        </label>
                        <Input
                          placeholder="Your company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="bg-[#F4F4F5] border-[#E4E4E7] focus:bg-white text-sm h-12 rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* E-mail Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#09090B]">
                      E-mail
                    </label>
                    <Input
                      type="email"
                      placeholder="Your e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#F4F4F5] border-[#E4E4E7] focus:bg-white text-sm h-12 rounded-xl"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    disabled={loading || !email}
                    className="w-full font-semibold text-sm bg-[#09090B] hover:bg-[#27272A] text-white shadow-sm h-12 rounded-xl mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating OTP Code...
                      </>
                    ) : (
                      <>
                        {mode === "signup" ? "Proceed with Registration →" : "Proceed with Instant Login →"}
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                /* Step 2: 6-Digit OTP Verification Form with Watermelon UI InputOTP */
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#09090B]">
                        Enter 6-Digit Code sent to {email}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("form");
                          setError(null);
                          setOtp("");
                        }}
                        className="text-xs font-semibold text-[#71717A] hover:underline"
                      >
                        Change Email
                      </button>
                    </div>

                    <div className="flex justify-center py-2">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        disabled={loading}
                        autoFocus
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    disabled={loading || otp.length < 6}
                    className="w-full font-semibold text-sm bg-[#09090B] hover:bg-[#27272A] text-white shadow-sm h-12 rounded-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Verify & Enter Knotted →
                      </>
                    )}
                  </Button>

                  <div className="pt-1 text-center">
                    {resendCooldown > 0 ? (
                      <p className="text-xs text-[#71717A]">
                        Resend code in <span className="font-semibold text-[#09090B]">{resendCooldown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitForm}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#09090B] hover:underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Resend Verification Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Disclaimer Footer */}
            <p className="text-[11px] text-[#71717A] leading-relaxed pt-4 border-t border-[#F4F4F5]">
              By clicking on the button, you consent to the processing of personal data and agree to the site&apos;s{" "}
              <Link href="/courses" className="underline font-medium text-[#09090B]">
                Privacy Policy
              </Link>{" "}
              and Terms of Service.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-2 text-xs text-[#71717A]">
        Knotted LMS — Secured with Arcjet WAF & Better Auth
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
      <AuthForm />
    </Suspense>
  );
}
