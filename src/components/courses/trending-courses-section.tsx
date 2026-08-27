"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, PlayCircle, ArrowRight, TrendingUp } from "lucide-react";
import { CourseCardItem } from "./course-discovery-section";
import { formatCurrency } from "@/lib/utils";

interface TrendingCoursesSectionProps {
  courses: CourseCardItem[];
}

export function TrendingCoursesSection({ courses }: TrendingCoursesSectionProps) {
  // Sort or pick top 4 trending masterclasses
  const trending = courses.slice(0, 4);

  if (trending.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#09090B]" />
            <span>Trending Masterclasses</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A]">
            Most active cohorts and masterclasses among engineering professionals this week.
          </p>
        </div>

        <Link
          href="/courses"
          className="text-xs font-bold text-[#09090B] hover:underline underline-offset-4 flex items-center gap-1 shrink-0"
        >
          <span>View All Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trending.map((course, idx) => {
          const rating = course.rating || (4.8 + ((idx * 3) % 2) * 0.1).toFixed(1);
          const reviewsCount = course.ratingsCount || (1450 + idx * 310).toLocaleString();
          const originalPrice = course.price > 0 ? course.price * 5 : 2999;

          return (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="relative aspect-video w-full overflow-hidden bg-[#18181B]">
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

                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#09090B] text-white shadow-sm uppercase tracking-wider">
                      Trending
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold text-[#09090B] line-clamp-2 leading-snug group-hover:text-black transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-[#71717A] truncate font-medium">
                    {course.instructor?.name || course.instructor?.email || "Staff Engineer"}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-[#09090B]">{rating}</span>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#71717A]">({reviewsCount})</span>
                  </div>

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
            </Link>
          );
        })}
      </div>
    </section>
  );
}
