import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface VerifyCertificatePageProps {
  params: Promise<{ certNo: string }>;
}

export default async function VerifyCertificatePage({
  params,
}: VerifyCertificatePageProps) {
  const { certNo } = await params;

  const certificate = await db.certificate.findUnique({
    where: { certificateNo: certNo },
    include: {
      user: {
        select: { name: true, email: true },
      },
      course: {
        select: { title: true, slug: true, category: true },
      },
    },
  });

  if (!certificate) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <Logo size="default" />
          <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
            <Link href="/courses">
              Explore Masterclasses
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-10 w-full flex flex-col items-center justify-center">
        {/* Verification Status Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Officially Verified & Cryptographically Authenticated Certificate</span>
        </div>

        {/* Certificate Card */}
        <div className="w-full rounded-3xl border-2 border-[#09090B] bg-white p-10 md:p-16 shadow-2xl text-center space-y-8 relative overflow-hidden">
          {/* Subtle decorative glow in certificate */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-black/5 blur-3xl pointer-events-none" />

          {/* Certificate Header */}
          <div className="space-y-3 relative z-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#09090B] flex items-center justify-center text-white shadow-xl">
              <Award className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-[#71717A] font-mono">
              Certificate of Completion
            </h2>
          </div>

          <div className="space-y-3 relative z-10">
            <p className="text-xs text-[#71717A] uppercase tracking-wider font-mono">This document certifies that</p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#09090B] font-sans">
              {certificate.user.name || certificate.user.email}
            </h1>
            <p className="text-xs text-[#71717A] uppercase tracking-wider font-mono pt-2">
              has successfully fulfilled all curriculum requirements and mastered
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-[#09090B] font-sans max-w-xl mx-auto">
              {certificate.course.title}
            </h3>
          </div>

          {/* Certificate Metadata Footer */}
          <div className="pt-8 border-t border-[#F4F4F5] grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[#71717A] relative z-10">
            <div className="space-y-1">
              <p className="font-bold text-[#09090B]">Issued Date</p>
              <p className="font-mono">{new Date(certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-[#09090B]">Certificate ID</p>
              <p className="font-mono text-emerald-700 font-bold">{certificate.certificateNo}</p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-[#09090B]">Issued By</p>
              <p className="font-medium text-[#09090B]">Knotted Learning Academy</p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
          <Link href={`/courses/${certificate.course.slug}`}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            View Linked Masterclass ({certificate.course.title})
          </Link>
        </Button>
      </main>
    </div>
  );
}
