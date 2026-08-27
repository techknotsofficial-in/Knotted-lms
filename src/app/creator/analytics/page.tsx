import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  Award,
  BookOpen,
  TrendingUp,
  Layers,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function CreatorAnalyticsPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/login?redirect=/creator/analytics");
  }

  const userId = session.user.id;

  // 1. Fetch instructor's courses with enrollments and payments
  const courses = await db.course.findMany({
    where: { instructorId: userId },
    include: {
      enrollments: {
        include: {
          payment: true,
        },
      },
      chapters: {
        include: {
          lessons: {
            select: { id: true },
          },
        },
      },
      certificates: true,
    },
  });

  // 2. Aggregate metrics
  const totalCourses = courses.length;
  const allEnrollments = courses.flatMap((c) => c.enrollments);
  const totalStudents = allEnrollments.length;

  const totalRevenue = allEnrollments.reduce((acc, enr) => {
    if (enr.payment && enr.payment.status === "SUCCESS") {
      return acc + Number(enr.payment.amount);
    }
    return acc;
  }, 0);

  const totalCertificates = courses.flatMap((c) => c.certificates).length;
  const averageCompletionRate =
    totalStudents > 0
      ? Math.round((totalCertificates / totalStudents) * 100)
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* 100% Full-Width Main Navigation Bar */}
      <MainNav user={session.user} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 space-y-8 w-full">
        {/* Title Section */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="mint" className="text-[10px] uppercase font-bold">
                Telemetry Studio
              </Badge>
              <span className="text-xs text-[#71717A]">Revenue, Enrollment & Completion Insights</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans">
              Creator Performance Analytics
            </h1>
          </div>

          <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
            <Link href="/creator/courses">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Manage Courses
            </Link>
          </Button>
        </section>

        {/* 4 Hero Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Revenue */}
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#71717A]">Total Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-[#09090B]" />
            </div>
            <div className="text-2xl font-extrabold text-[#09090B] font-mono">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">100% Zero platform cut</p>
          </div>

          {/* Card 2: Students */}
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#71717A]">Total Enrolled Students</span>
              <Users className="w-4 h-4 text-[#09090B]" />
            </div>
            <div className="text-2xl font-extrabold text-[#09090B] font-mono">
              {totalStudents}
            </div>
            <p className="text-[11px] text-[#71717A]">Active learner enrollments</p>
          </div>

          {/* Card 3: Certificates */}
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#71717A]">Certificates Issued</span>
              <Award className="w-4 h-4 text-[#09090B]" />
            </div>
            <div className="text-2xl font-extrabold text-[#09090B] font-mono">
              {totalCertificates}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">Cryptographically verified</p>
          </div>

          {/* Card 4: Completion Rate */}
          <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#71717A]">Completion Velocity</span>
              <TrendingUp className="w-4 h-4 text-[#09090B]" />
            </div>
            <div className="text-2xl font-extrabold text-[#09090B] font-mono">
              {averageCompletionRate}%
            </div>
            <p className="text-[11px] text-[#71717A]">Masterclass finishing rate</p>
          </div>
        </div>

        {/* Per-Course Breakdown Table */}
        <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs space-y-6">
          <div className="border-b border-[#F4F4F5] pb-4">
            <h2 className="text-lg font-bold text-[#09090B]">Masterclass Breakdown</h2>
            <p className="text-xs text-[#71717A]">
              Detailed performance metrics per published curriculum track.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717A]">
              No courses found. Create your first masterclass to see telemetry data.
            </div>
          ) : (
            <div className="divide-y divide-[#F4F4F5]">
              {courses.map((c) => {
                const courseRevenue = c.enrollments.reduce((acc, enr) => {
                  if (enr.payment && enr.payment.status === "SUCCESS") {
                    return acc + Number(enr.payment.amount);
                  }
                  return acc;
                }, 0);

                return (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="mint" className="text-[10px] uppercase font-bold">
                          {c.category}
                        </Badge>
                        <Badge variant={c.isPublished ? "default" : "outline"} className={c.isPublished ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}>
                          {c.isPublished ? "Live" : "Draft"}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-bold text-[#09090B]">{c.title}</h3>
                      <p className="text-[11px] font-mono text-[#71717A]">
                        {c.chapters.length} Modules • {c.enrollments.length} Students • {c.certificates.length} Certs
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-[#71717A] block">Course Revenue</span>
                        <span className="text-sm font-bold font-mono text-[#09090B]">
                          {formatCurrency(courseRevenue)}
                        </span>
                      </div>

                      <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
                        <Link href={`/creator/courses/${c.id}`}>
                          Edit Course
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Full-Width Footer */}
      <Footer />
    </div>
  );
}
