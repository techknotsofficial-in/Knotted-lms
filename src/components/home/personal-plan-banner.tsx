import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export function PersonalPlanBanner() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10">
      <div className="rounded-3xl bg-[#09090B] text-white border border-[#27272A] p-8 sm:p-12 shadow-2xl overflow-hidden relative">
        {/* Background Subtle Glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Plan Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>All-Access Masterclass Pass</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold font-sans tracking-tight text-white leading-tight">
                Accelerate your engineering career with Knotted All-Access
              </h2>
              <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed max-w-xl">
                Subscribe to unlock all premium technical masterclasses, interactive live cohort sessions, and verifiable completion certificates.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-[#E4E4E7] font-medium">
                  Ultra-HD 4K instant video streaming
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-[#E4E4E7] font-medium">
                  Cryptographically verifiable completion certificates
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-[#E4E4E7] font-medium">
                  Interactive live cohort classrooms & Q&A
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-[#E4E4E7] font-medium">
                  Lifetime access to all future curriculum updates
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="default"
                size="lg"
                className="bg-white text-[#09090B] hover:bg-[#F4F4F5] font-bold text-xs sm:text-sm rounded-xl h-11 px-6 shadow-sm"
                asChild
              >
                <Link href="/courses">
                  Explore Masterclasses
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 font-bold text-xs sm:text-sm rounded-xl h-11 px-6"
                asChild
              >
                <Link href="/login">Join Platform</Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-4/3 rounded-2xl overflow-hidden border border-white/15 bg-white/5 p-4 flex flex-col justify-end shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"
                alt="Engineering Cohort"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover opacity-60"
              />
              <div className="relative z-10 p-4 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="mint" className="text-[10px] font-bold">VERIFIED COHORT</Badge>
                  <span className="text-[10px] font-mono text-white/60">Interactive Sessions</span>
                </div>
                <p className="text-xs font-bold text-white">Full-Stack & Distributed Systems Track</p>
                <p className="text-[10px] text-[#A1A1AA]">Led by Industry Specialists</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
