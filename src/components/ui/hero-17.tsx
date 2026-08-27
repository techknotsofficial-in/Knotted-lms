"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge24 } from "@/components/ui/badge-24";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";

interface Hero17Props {
  primaryCtaLink?: string;
  secondaryCtaLink?: string;
  secondaryCtaText?: string;
}

export function Hero17({
  primaryCtaLink = "/courses",
  secondaryCtaLink = "/dashboard",
  secondaryCtaText = "My Dashboard",
}: Hero17Props) {
  return (
    <div className="relative w-full min-h-[75vh] flex flex-col justify-center items-center overflow-hidden py-28 px-6">
      {/* 100% Full-Bleed High-Visibility Classroom Background Image */}
      <div className="absolute inset-0 w-full h-full -z-0">
        <Image
          src="/quilia-zFSo6bnZJTw-unsplash.jpg"
          alt="Classroom Education Background"
          fill
          priority
          className="object-cover object-center opacity-85 transition-opacity duration-700"
        />
        {/* Soft, Light Dark Overlay to Keep Background Clearly Visible & Colorful */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/65" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 flex flex-col items-center">
        {/* Animated Status Pill */}
        <Badge24
          variant="success"
          pulse={true}
          icon={<Sparkles className="w-3.5 h-3.5" />}
          className="shadow-xl border-white/40 bg-black/40 text-white backdrop-blur-md px-5 py-2 text-xs hover:bg-black/60 transition-all drop-shadow-md"
        >
          Next-Gen Masterclasses & Live Cohorts
        </Badge24>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05] font-sans drop-shadow-2xl">
          Tying knowledge into{" "}
          <span className="text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] underline decoration-white/40 underline-offset-8">
            unbreakable knots.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-white max-w-3xl font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Master cutting-edge engineering architectures with high-definition video masterclasses, interactive cohorts, and verifiable completion certificates.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            variant="default"
            size="lg"
            className="bg-white text-[#09090B] hover:bg-[#F4F4F5] font-bold text-base h-14 px-10 rounded-2xl shadow-2xl shadow-black/50 transition-all hover:scale-105"
            asChild
          >
            <Link href={primaryCtaLink}>
              Browse Masterclasses
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="bg-black/40 border-white/40 text-white hover:bg-black/60 font-semibold text-base h-14 px-10 rounded-2xl backdrop-blur-md shadow-xl"
            asChild
          >
            <Link href={secondaryCtaLink}>
              <PlayCircle className="w-5 h-5 mr-2 text-white" />
              {secondaryCtaText}
            </Link>
          </Button>
        </div>

        {/* Trust Verification Indicators */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-8 text-sm text-white font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Ultra-HD 4K Video Streaming
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Interactive Live Classrooms
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Verifiable Completion Certificates
          </span>
        </div>
      </div>
    </div>
  );
}
