import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const TRACKS = [
  {
    title: "Full-Stack & Cloud Architecture",
    description: "Master modern server components, database connection management, and scalable distributed architectures.",
    category: "Full-Stack Development",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    badge: "Most Popular",
    lessons: "36+ Modules",
  },
  {
    title: "Cloud Infrastructure & High-Speed Media",
    description: "Build ultra-low latency video streaming pipelines, presigned cloud storage architectures, and protected media delivery.",
    category: "Cloud Architecture",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    badge: "Cloud Specialized",
    lessons: "24+ Modules",
  },
  {
    title: "AI Agents & Autonomous Decision Systems",
    description: "Design autonomous decision graphs, intelligent tool calling pipelines, and structured cognitive memory architectures.",
    category: "Artificial Intelligence",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    badge: "New Track",
    lessons: "28+ Modules",
  },
];

export function LearningTracksSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-2 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans tracking-tight">
          Learn essential engineering & architecture skills
        </h2>
        <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
          Curated learning tracks designed by industry architects to take you from foundational principles to production deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TRACKS.map((track) => (
          <Link
            key={track.title}
            href={`/courses?category=${encodeURIComponent(track.category)}`}
            className="group flex flex-col justify-between rounded-3xl border border-[#E4E4E7] bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-16/10 w-full overflow-hidden bg-[#18181B]">
              <Image
                src={track.image}
                alt={track.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#09090B] text-white shadow-sm uppercase tracking-wider">
                  {track.badge}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                  <span>{track.category}</span>
                  <span className="font-bold text-[#09090B]">{track.lessons}</span>
                </div>
                <h3 className="text-base font-bold text-[#09090B] group-hover:text-black transition-colors leading-snug">
                  {track.title}
                </h3>
                <p className="text-xs text-[#71717A] leading-relaxed line-clamp-2">
                  {track.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F4F4F5] flex items-center justify-between text-xs font-bold text-[#09090B] group-hover:translate-x-1 transition-transform">
                <span>Explore Track Curriculums</span>
                <ArrowRight className="w-4 h-4 text-[#71717A]" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
