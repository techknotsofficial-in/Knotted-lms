import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const CAREER_PATHS = [
  {
    role: "Cloud & Edge Storage Architect",
    salary: "₹18 LPA – ₹45 LPA avg.",
    category: "Cloud Architecture",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
  },
  {
    role: "Full-Stack Server Systems Engineer",
    salary: "₹15 LPA – ₹38 LPA avg.",
    category: "Full-Stack Development",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
  },
  {
    role: "Autonomous AI Agent Engineer",
    salary: "₹22 LPA – ₹55 LPA avg.",
    category: "Artificial Intelligence",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  },
];

export function CareerPathwaysSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-1 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans tracking-tight">
          Ready to accelerate your career?
        </h2>
        <p className="text-xs sm:text-sm text-[#71717A]">
          Follow structured technical curriculums mapped to in-demand engineering specializations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {CAREER_PATHS.map((path) => (
          <Link
            key={path.role}
            href={`/courses?category=${encodeURIComponent(path.category)}`}
            className="group flex flex-col justify-between rounded-3xl border border-[#E4E4E7] bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-4/3 w-full overflow-hidden bg-[#18181B]">
              <Image
                src={path.image}
                alt={path.role}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="p-6 space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
                  {path.salary}
                </span>
                <h3 className="text-base font-bold text-[#09090B] group-hover:text-black transition-colors pt-1 leading-snug">
                  {path.role}
                </h3>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#09090B] group-hover:translate-x-1 transition-transform">
                <span>View Recommended Curriculums</span>
                <ArrowRight className="w-4 h-4 text-[#71717A]" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
