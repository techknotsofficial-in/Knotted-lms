import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Quote, ArrowRight, CheckCircle2 } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "The video player is instant with zero buffering. We built our company's internal engineering onboarding around these technical masterclasses.",
    author: "Sean Quinn",
    role: "Lead Systems Architect, TimeKeeper",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    courseTitle: "Enterprise Next.js 16 & Server Architecture",
    courseSlug: "enterprise-nextjs-16-server-architecture",
  },
  {
    quote:
      "The curriculum structure and interactive classrooms gave our academy the exact clarity needed to train over 200 developers with high completion rates.",
    author: "Elena Rostova",
    role: "VP of Engineering Education, CloudScale",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
    courseTitle: "Edge Security, WAF & Anti-Piracy DRM",
    courseSlug: "edge-security-waf-anti-piracy-drm",
  },
  {
    quote:
      "From database connection pooling to multi-agent LangGraph pipelines, these masterclasses provide real, production-tested architectures.",
    author: "Marcus Vance",
    role: "Senior Distributed Engineer, DataMesh",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    courseTitle: "Cloudflare R2 & Edge Storage Mastery",
    courseSlug: "cloudflare-r2-edge-storage-mastery",
  },
];

export function TestimonialsSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-1 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans tracking-tight">
          How learners like you are achieving their goals
        </h2>
        <p className="text-xs sm:text-sm text-[#71717A]">
          Verified stories from architects and engineers scaling production platforms with Knotted.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.author}
            className="flex flex-col justify-between rounded-3xl border border-[#E4E4E7] bg-white p-6 sm:p-8 shadow-xs space-y-6 hover:border-[#09090B] transition-colors"
          >
            <div className="space-y-4">
              <Quote className="w-8 h-8 text-[#E4E4E7]" />
              <p className="text-xs sm:text-sm text-[#09090B] font-medium leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#F4F4F5]">
              {/* Author Row */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E4E4E7] shrink-0">
                  <Image src={t.avatar} alt={t.author} fill sizes="40px" className="object-cover" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#09090B] flex items-center gap-1">
                    <span>{t.author}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </h3>
                  <p className="text-[10px] text-[#71717A]">{t.role}</p>
                </div>
              </div>

              {/* Linked Course */}
              <Link
                href={`/courses/${t.courseSlug}`}
                className="block text-[11px] font-bold text-[#09090B] hover:underline underline-offset-2 flex items-center justify-between group pt-1"
              >
                <span className="truncate max-w-[220px]">{t.courseTitle}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#71717A] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
