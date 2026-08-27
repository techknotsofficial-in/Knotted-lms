import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCourseBySlug, checkUserEnrollment } from "@/lib/courses";
import { auth } from "@/lib/auth";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  Film,
  FileText,
  Clock,
  Layers,
  Award,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Users,
} from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  // Check if current user is signed in and enrolled
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  const isEnrolled = session?.user
    ? await checkUserEnrollment(session.user.id, course.id)
    : false;

  const allLessons = course.chapters.flatMap((c) => c.lessons);
  const totalLessons = allLessons.length;
  const totalDurationSec = allLessons.reduce((acc, l) => acc + (l.durationSec || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* Edge-to-Edge Navigation Bar */}
      <MainNav user={session?.user} />

      {/* Hero Banner Section */}
      <section className="w-full bg-[#09090B] text-white border-b border-[#27272A] py-12 lg:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left 7/8 Columns: Course Header */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="mint" className="text-xs uppercase font-bold px-3 py-1">
                {course.category}
              </Badge>
              <span className="text-xs font-mono text-[#A1A1AA]">
                {course.level} Level
              </span>
              <span className="text-xs text-[#71717A]">•</span>
              <span className="text-xs text-[#A1A1AA]">
                Last updated {new Date(course.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-sans tracking-tight text-white leading-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-base sm:text-lg text-[#D4D4D8] leading-relaxed max-w-3xl">
                  {course.subtitle}
                </p>
              )}
            </div>

            {/* Instructor & Highlights */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-[#A1A1AA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#27272A] border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                  {course.instructor?.name?.charAt(0) || "I"}
                </div>
                <span className="text-white font-medium">
                  Created by <strong className="text-white">{course.instructor?.name || "Masterclass Architect"}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>English [Auto-Captions]</span>
              </div>
            </div>

            {/* Key Stats Bar */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 text-xs font-mono text-[#E4E4E7]">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>{course.chapters.length} Modules</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Film className="w-4 h-4 text-emerald-400" />
                <span>{totalLessons} High-Definition Lessons</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{formatDuration(totalDurationSec)} Total Runtime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Certificate Included</span>
              </div>
            </div>
          </div>

          {/* Right 4/5 Columns: Sticky Enrollment Card */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-[#27272A] bg-[#18181B] p-6 sm:p-8 shadow-2xl text-white space-y-6">
              {/* Thumbnail / Preview Image */}
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-black border border-white/10">
                <Image
                  src={course.thumbnailUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"}
                  alt={course.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  unoptimized
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white">
                    {course.price === 0 ? "Free" : formatCurrency(course.price)}
                  </span>
                  <span className="text-xs font-mono text-[#A1A1AA]">Full Lifetime Access</span>
                </div>

                {isEnrolled ? (
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-sm h-12 rounded-2xl shadow-lg"
                    asChild
                  >
                    <Link href={`/learn/${course.slug}`}>
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Continue Learning
                    </Link>
                  </Button>
                ) : course.price === 0 ? (
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full bg-white hover:bg-[#F4F4F5] text-[#09090B] font-extrabold text-sm h-12 rounded-2xl shadow-lg"
                    asChild
                  >
                    <Link href={`/checkout/${course.slug}`}>
                      Enroll Free Preview
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full bg-white hover:bg-[#F4F4F5] text-[#09090B] font-extrabold text-sm h-12 rounded-2xl shadow-lg"
                    asChild
                  >
                    <Link href={`/checkout/${course.slug}`}>
                      Buy Masterclass Pass
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}

                <p className="text-center text-[11px] text-[#A1A1AA]">
                  30-day money-back guarantee • Full verifiable certificate
                </p>
              </div>

              {/* Quick Perks List */}
              <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-[#D4D4D8]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ultra-HD 4K instant video streaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive cohort live sessions & Q&A</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cryptographically signed certificate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Access on desktop, tablet, and mobile</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Curriculum & Course Description */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left 8 Columns: What You'll Learn & Full Curriculum */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Description Section */}
          {course.description && (
            <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs space-y-4">
              <h2 className="text-xl font-extrabold text-[#09090B] font-sans">
                Masterclass Overview
              </h2>
              <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-[#71717A] leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
            </div>
          )}

          {/* Curriculum Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#09090B] font-sans">
                Curriculum Structure
              </h2>
              <span className="text-xs font-mono text-[#71717A]">
                {course.chapters.length} modules • {totalLessons} lessons
              </span>
            </div>

            <div className="space-y-3">
              {course.chapters.map((chapter, cIdx) => (
                <div
                  key={chapter.id}
                  className="rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden shadow-2xs"
                >
                  <div className="bg-[#F4F4F5] px-6 py-3.5 border-b border-[#E4E4E7] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#09090B]">
                      Module {cIdx + 1}: {chapter.title}
                    </h3>
                    <span className="text-[11px] font-mono text-[#71717A]">
                      {chapter.lessons.length} lessons
                    </span>
                  </div>

                  <div className="divide-y divide-[#F4F4F5]">
                    {chapter.lessons.map((lesson, lIdx) => (
                      <div
                        key={lesson.id}
                        className="px-6 py-3 flex items-center justify-between text-xs hover:bg-[#FAFAFA] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.type === "VIDEO" ? (
                            <PlayCircle className="w-4 h-4 text-[#71717A]" />
                          ) : (
                            <FileText className="w-4 h-4 text-[#71717A]" />
                          )}
                          <span className="font-medium text-[#09090B]">
                            {lIdx + 1}. {lesson.title}
                          </span>
                          {lesson.isFree && (
                            <Badge variant="mint" className="text-[9px] uppercase font-bold py-0">
                              Free Preview
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-[#71717A]">
                          <span>{formatDuration(lesson.durationSec)}</span>
                          {!isEnrolled && !lesson.isFree && (
                            <Lock className="w-3.5 h-3.5 text-[#A1A1AA]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Instructor Profile */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#09090B] uppercase tracking-wider">
              Instructor Profile
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#09090B] text-white flex items-center justify-center font-bold text-xl">
                {course.instructor?.name?.charAt(0) || "I"}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-[#09090B]">
                  {course.instructor?.name || "Masterclass Instructor"}
                </h4>
                <p className="text-xs text-[#71717A]">Lead Systems Architect</p>
              </div>
            </div>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Specialized in production-grade full-stack architectures, high-concurrency systems, and modern edge infrastructure.
            </p>
          </div>
        </div>
      </main>

      {/* Full-Width Footer */}
      <Footer />
    </div>
  );
}
