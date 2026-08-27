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
  Plus, 
  BookOpen, 
  Edit3, 
  Layers, 
  DollarSign, 
  Users, 
  ExternalLink,
  Video,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function CreatorCoursesPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/login?redirect=/creator/courses");
  }

  const userRole = (session.user && "role" in session.user ? (session.user.role as string) : "STUDENT")?.toUpperCase();
  const isAdmin = userRole === "ADMIN" || userRole === "STAFF";

  // Fetch real instructor courses from PostgreSQL
  const courses = await db.course.findMany({
    where: isAdmin ? {} : { instructorId: session.user.id },
    include: {
      chapters: {
        include: {
          lessons: {
            select: { id: true },
          },
        },
      },
      enrollments: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* 100% Full-Width Edge-to-Edge Navigation Bar */}
      <MainNav user={session.user} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 space-y-8 w-full">
        {/* Title Section */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="mint" className="text-[10px] uppercase font-bold">
                Creator Studio
              </Badge>
              <span className="text-xs text-[#71717A]">Curriculum & Masterclass Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans">
              Your Course Library
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
              <Link href="/creator/live">
                <Video className="w-4 h-4 mr-1.5" />
                Live Cohorts Studio
              </Link>
            </Button>

            <Button variant="default" size="sm" asChild className="bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold shadow-xs">
              <Link href="/creator/courses/new">
                <Plus className="w-4 h-4 mr-1.5" />
                Create New Masterclass
              </Link>
            </Button>
          </div>
        </section>

        {/* Course Grid */}
        {courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E4E4E7] bg-white p-16 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B]">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-[#09090B]">No Courses Created Yet</h3>
              <p className="text-xs text-[#71717A]">
                Start authoring your first deep-dive masterclass with our rich drag-and-drop curriculum builder.
              </p>
            </div>
            <Button variant="default" size="sm" asChild className="bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold">
              <Link href="/creator/courses/new">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Masterclass
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const totalLessons = course.chapters.flatMap((c) => c.lessons).length;

              return (
                <div
                  key={course.id}
                  className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between hover:border-[#09090B] transition-all hover:shadow-md space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="mint" className="text-[10px] uppercase font-bold">
                        {course.category}
                      </Badge>
                      <Badge
                        variant={course.isPublished ? "default" : "outline"}
                        className={course.isPublished ? "bg-emerald-600 text-white text-[10px]" : "text-[10px] text-[#71717A]"}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-[#09090B] line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#71717A] line-clamp-2">
                        {course.subtitle || "No subtitle provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#F4F4F5] text-xs">
                      <div>
                        <span className="text-[10px] text-[#71717A] block font-mono">Price</span>
                        <span className="font-bold text-[#09090B]">
                          {Number(course.price) === 0 ? "Free" : formatCurrency(Number(course.price))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#71717A] block font-mono">Lessons</span>
                        <span className="font-bold text-[#09090B]">{totalLessons}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#71717A] block font-mono">Students</span>
                        <span className="font-bold text-[#09090B]">{course.enrollments.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="default" size="sm" asChild className="flex-1 bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold h-10">
                      <Link href={`/creator/courses/${course.id}`}>
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                        Edit Curriculum
                      </Link>
                    </Button>

                    <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-semibold bg-white h-10 px-3">
                      <Link href={`/courses/${course.slug}`} target="_blank">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Full-Width Footer */}
      <Footer />
    </div>
  );
}
