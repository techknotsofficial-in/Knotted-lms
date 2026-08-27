"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  PlayCircle,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  User,
} from "lucide-react";
import { formatCurrency, formatDuration, cn } from "@/lib/utils";

export interface CourseCardItem {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  price: number;
  currency: string;
  level: string;
  category: string;
  instructor?: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
  } | null;
  totalLessons?: number;
  totalDurationSec?: number;
  rating?: number;
  ratingsCount?: number;
  badgeTag?: "Bestseller" | "Hot & New" | "Free Masterclass" | "Enterprise";
}

interface CourseDiscoverySectionProps {
  courses: CourseCardItem[];
}

const CATEGORIES = [
  "All Topics",
  "Full-Stack Development",
  "Cloud Architecture",
  "Edge Security",
  "UI/UX Engineering",
  "Networking",
];

export function CourseDiscoverySection({ courses }: CourseDiscoverySectionProps) {
  const [activeCategory, setActiveCategory] = useState("All Topics");

  const filteredCourses =
    activeCategory === "All Topics"
      ? courses
      : courses.filter(
          (c) =>
            c.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
            activeCategory.toLowerCase().includes(c.category.toLowerCase())
        );

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-16 space-y-8">
      {/* Header (Udemy Style) */}
      <div className="space-y-2 max-w-3xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#09090B] tracking-tight font-sans">
          Skills to transform your career and life
        </h2>
        <p className="text-sm sm:text-base text-[#71717A] leading-relaxed">
          From critical engineering foundations to distributed systems, Knotted accelerates your professional mastery with high-definition video masterclasses.
        </p>
      </div>

      {/* Interactive Category Filter Tabs (Udemy Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#E4E4E7]">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all select-none",
                isActive
                  ? "bg-[#09090B] text-white shadow-sm"
                  : "bg-transparent text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5]"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-[#E4E4E7] bg-[#FAFAFA] space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-[#71717A]" />
          <h4 className="text-base font-bold text-[#09090B]">No courses found in this topic yet</h4>
          <p className="text-xs text-[#71717A]">Check back soon or explore All Topics above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCourses.map((course, idx) => {
            // Curated mock ratings and badges for authentic presentation
            const rating = course.rating || (4.7 + ((idx * 7) % 3) * 0.1).toFixed(1);
            const reviewsCount = course.ratingsCount || (1240 + idx * 430).toLocaleString();
            const badgeTag =
              course.price === 0
                ? "Free Masterclass"
                : idx === 0
                ? "Bestseller"
                : idx === 1
                ? "Hot & New"
                : "Enterprise";

            const originalPrice = course.price > 0 ? course.price * 6 : 2999;

            return (
              <div
                key={course.id}
                className="group flex flex-col justify-between rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  {/* 16:9 Aspect Video Thumbnail Container */}
                  <Link href={`/courses/${course.slug}`} className="block relative aspect-video w-full overflow-hidden bg-[#18181B]">
                    {course.thumbnailUrl ? (
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/40 p-4 text-center">
                        <PlayCircle className="w-10 h-10 mb-1.5" />
                        <span className="text-xs font-mono font-bold">Knotted Masterclass</span>
                      </div>
                    )}

                    {/* Badge Pill */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider",
                          badgeTag === "Bestseller"
                            ? "bg-amber-400 text-[#09090B]"
                            : badgeTag === "Hot & New"
                            ? "bg-[#09090B] text-white"
                            : "bg-emerald-500 text-white"
                        )}
                      >
                        {badgeTag}
                      </span>
                    </div>
                  </Link>

                  {/* Course Content Details */}
                  <div className="p-4 space-y-2">
                    <Link href={`/courses/${course.slug}`}>
                      <h3 className="text-sm sm:text-base font-bold text-[#09090B] line-clamp-2 leading-snug group-hover:text-black transition-colors">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-[#71717A] truncate font-medium">
                      {course.instructor?.name || course.instructor?.email || "Industry Specialist"}
                    </p>

                    {/* Star Rating Row */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-[#09090B]">{rating}</span>
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#71717A]">({reviewsCount})</span>
                    </div>

                    {/* Price Row (Udemy Style) */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-base font-extrabold text-[#09090B]">
                        {course.price === 0 ? "Free" : formatCurrency(course.price)}
                      </span>
                      {course.price > 0 && (
                        <span className="text-xs text-[#A1A1AA] line-through">
                          {formatCurrency(originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold bg-[#F4F4F5] hover:bg-[#09090B] hover:text-white border-[#E4E4E7] rounded-xl transition-all"
                    asChild
                  >
                    <Link href={`/courses/${course.slug}`}>
                      View Masterclass
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Category View Link */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-[#09090B] text-[#09090B] font-bold text-xs rounded-xl hover:bg-[#F4F4F5]"
        >
          <Link href="/courses">
            Show all {activeCategory === "All Topics" ? "" : `${activeCategory} `}masterclasses
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
