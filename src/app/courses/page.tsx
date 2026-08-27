import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getPublishedCourses } from "@/lib/courses";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MainNav } from "@/components/layout/main-nav";
import { Footer } from "@/components/layout/footer";
import {
  Compass,
  PlayCircle,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface CoursesPageProps {
  searchParams: Promise<{ category?: string; query?: string }>;
}

export default async function CoursesCatalogPage({
  searchParams,
}: CoursesPageProps) {
  const reqHeaders = await headers();
  const [{ category, query }, allCourses, session] = await Promise.all([
    searchParams,
    getPublishedCourses(),
    auth.api.getSession({ headers: reqHeaders }),
  ]);

  const userRole = (session?.user && "role" in session.user ? (session.user.role as string) : "STUDENT")?.toUpperCase() || "STUDENT";

  // Filter courses by category and search query
  const filteredCourses = allCourses.filter((course) => {
    const matchesCategory =
      !category || category === "All" || course.category.toLowerCase() === category.toLowerCase();

    const matchesQuery =
      !query ||
      course.title.toLowerCase().includes(query.toLowerCase()) ||
      (course.description?.toLowerCase().includes(query.toLowerCase()) ?? false);

    return matchesCategory && matchesQuery;
  });

  const categories = [
    "All",
    "Full-Stack Development",
    "Cloud Architecture",
    "Edge Security",
    "UI/UX Engineering",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* 100% Full-Width Navigation Bar */}
      <MainNav user={session?.user} />

      {/* Main Catalog View */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 space-y-10 w-full">
        {/* Catalog Banner */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2">
            <Badge variant="mint">Masterclass Discovery</Badge>
            <span className="text-xs text-[#71717A]">Zero-Egress High Performance Streams</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#09090B] font-sans">
            Master Cutting-Edge Engineering
          </h1>
          <p className="text-base text-[#71717A] max-w-2xl">
            Explore deep-dive technical curriculums authored by industry experts.
          </p>
        </section>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-[#E4E4E7] pb-6">
          {categories.map((cat) => {
            const isSelected = (!category && cat === "All") || category === cat;
            return (
              <Link
                key={cat}
                href={cat === "All" ? "/courses" : `/courses?category=${encodeURIComponent(cat)}`}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-[#09090B] text-white shadow-xs"
                    : "bg-white text-[#09090B] border border-[#E4E4E7] hover:bg-[#F4F4F5]"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Courses Feed Grid */}
        {filteredCourses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E4E4E7] bg-white p-16 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B] border border-[#E4E4E7]">
              <Compass className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-[#09090B]">No Published Courses Found</h3>
              <p className="text-xs text-[#71717A]">
                {category
                  ? `No courses currently published in ${category}.`
                  : "Instructors are preparing masterclasses. Check back soon!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const totalLessons = course.totalLessons ?? (course.chapters ? course.chapters.flatMap((c: any) => c.lessons).length : 0);

              return (
                <Card
                  key={course.id}
                  className="flex flex-col justify-between hover:border-[#09090B] transition-all bg-white border-[#E4E4E7] overflow-hidden group"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="mint">{course.category}</Badge>
                      <span className="text-sm font-bold text-[#09090B]">
                        {course.price === 0 ? "Free" : formatCurrency(course.price)}
                      </span>
                    </div>

                    <CardTitle className="text-lg line-clamp-2 text-[#09090B]">
                      {course.title}
                    </CardTitle>

                    <CardDescription className="line-clamp-2 text-xs">
                      {course.subtitle || course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center justify-between text-xs text-[#71717A] py-2 border-t border-[#F4F4F5]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#09090B]" />
                        {course.chapters.length} Modules ({totalLessons} Lessons)
                      </span>
                      <span>Level: {course.level}</span>
                    </div>

                    <Button variant="default" className="w-full font-semibold shadow-xs" asChild>
                      <Link href={`/courses/${course.slug}`}>
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Explore Curriculum
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Rich Monochrome Footer */}
      <Footer />
    </div>
  );
}
