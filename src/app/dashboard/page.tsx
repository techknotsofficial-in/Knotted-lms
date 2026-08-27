import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";
import {
  BookOpen,
  Award,
  PlayCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Video,
  Layers,
} from "lucide-react";

export default async function DashboardPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/login?redirect=/dashboard");
  }

  const userId = session.user.id;

  // Run all database queries in parallel
  const [enrollments, userBadges, userProgresses, certificates] = await Promise.all([
    // 1. Fetch user's enrollments with course details & progress
    db.enrollment.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            chapters: {
              include: {
                lessons: { select: { id: true, durationSec: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 2. Fetch User Badges
    db.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    }),

    // 3. Fetch User Progress records
    db.userProgress.findMany({
      where: { userId },
    }),

    // 4. Fetch User Certificates
    db.certificate.findMany({
      where: { userId },
      include: { course: true },
    }),
  ]);

  const completedLessonIds = new Set(
    userProgresses.filter((p) => p.isCompleted).map((p) => p.lessonId)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* 100% Full-Width Edge-to-Edge Navigation Bar */}
      <MainNav user={session.user} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 space-y-10 w-full">
        {/* Welcome Banner */}
        <section className="rounded-3xl bg-[#09090B] text-white p-8 md:p-10 border border-[#27272A] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Learner Headquarters</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold font-sans text-white">
              Welcome back, {session.user.name || session.user.email.split("@")[0]}
            </h1>
            <p className="text-sm text-[#A1A1AA] max-w-xl">
              Track your enrolled masterclasses, continue video lessons, and earn verifiable completion certificates.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="default" size="lg" className="bg-white text-black font-semibold hover:bg-[#F4F4F5]" asChild>
              <Link href="/courses">
                Explore More Courses
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-6 space-y-1 bg-white border-[#E4E4E7]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Enrolled Masterclasses</p>
            <p className="text-3xl font-extrabold text-[#09090B]">{enrollments.length}</p>
          </Card>

          <Card className="p-6 space-y-1 bg-white border-[#E4E4E7]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Completed Lessons</p>
            <p className="text-3xl font-extrabold text-[#09090B]">{completedLessonIds.size}</p>
          </Card>

          <Card className="p-6 space-y-1 bg-white border-[#E4E4E7]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Certificates & Badges</p>
            <p className="text-3xl font-extrabold text-[#09090B]">
              {certificates.length + userBadges.length}
            </p>
          </Card>
        </div>

        {/* Enrolled Courses Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#09090B] font-sans">Your Active Courses</h2>
              <p className="text-xs text-[#71717A]">Pick up right where you left off</p>
            </div>
          </div>

          {enrollments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E4E4E7] bg-white p-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B] border border-[#E4E4E7]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-bold text-[#09090B]">No active course enrollments yet</h3>
                <p className="text-xs text-[#71717A]">
                  Browse our masterclass catalog to enroll and start learning.
                </p>
              </div>
              <Button variant="default" asChild>
                <Link href="/courses">Explore Course Catalog</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enr) => {
                const totalLessons = enr.course.chapters.flatMap((c) => c.lessons).length;
                const completedInThisCourse = enr.course.chapters
                  .flatMap((c) => c.lessons)
                  .filter((l) => completedLessonIds.has(l.id)).length;
                
                const percent = totalLessons > 0 ? Math.round((completedInThisCourse / totalLessons) * 100) : 0;

                return (
                  <Card key={enr.id} className="flex flex-col justify-between hover:border-[#09090B] transition-all bg-white border-[#E4E4E7]">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="mint">{enr.course.category}</Badge>
                        <span className="text-xs font-bold text-[#09090B]">{percent}% Complete</span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 text-[#09090B]">{enr.course.title}</CardTitle>
                      <CardDescription className="text-xs">
                        Instructor: {enr.course.instructor.name || "Knotted Faculty"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-1.5">
                        <Progress value={percent} />
                        <p className="text-[11px] text-[#71717A] text-right">
                          {completedInThisCourse} of {totalLessons} lessons completed
                        </p>
                      </div>

                      <Button variant="default" className="w-full font-semibold shadow-xs" asChild>
                        <Link href={`/learn/${enr.course.slug}`}>
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Resume Learning
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Earned Badges Section */}
        {userBadges.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#09090B] font-sans">Earned Achievements & Badges</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {userBadges.map((ub) => (
                <div key={ub.id} className="p-4 rounded-2xl bg-white border border-[#E4E4E7] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B] shrink-0 font-bold border border-[#E4E4E7]">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#09090B]">{ub.badge.title}</h4>
                    <p className="text-[10px] text-[#71717A]">{ub.badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Full-Width Monochrome Footer */}
      <Footer />
    </div>
  );
}
