import React from "react";
import Link from "next/link";
import { Award, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const CERTS = [
  {
    title: "Knotted Certified Distributed Architect",
    code: "KNOT-ARCH-2026",
    issuer: "Knotted Academy",
    skills: "Next.js 16 • Cloudflare R2 • Supabase Pooling",
  },
  {
    title: "Zero-Egress Edge Security Specialist",
    code: "KNOT-EDGE-SEC",
    issuer: "Edge Defense Board",
    skills: "Arcjet WAF • Forensic Watermarking • DRM",
  },
  {
    title: "Autonomous AI Agent Systems Engineer",
    code: "KNOT-AI-AGENT",
    issuer: "Cognitive Systems Lab",
    skills: "LangGraph • Tool Calling • State Graphs",
  },
];

export function CertificationHubSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10">
      <div className="rounded-3xl bg-[#09090B] text-white border border-[#27272A] p-8 sm:p-12 shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Verifiable Digital Credentials</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-sans text-white tracking-tight">
              Get certified and accelerate your career
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              Earn cryptographically signed completion certificates verified directly on our public verification portal.
            </p>
          </div>

          <Button
            variant="default"
            size="lg"
            className="bg-white text-[#09090B] hover:bg-[#F4F4F5] font-bold text-xs sm:text-sm rounded-xl h-11 px-6 shadow-sm self-start md:self-auto"
            asChild
          >
            <Link href="/courses">
              Explore Certification Tracks
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        {/* 3 Certifications Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {CERTS.map((cert) => (
            <div
              key={cert.code}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                  {cert.code}
                </span>
                <ShieldCheck className="w-4 h-4 text-[#A1A1AA]" />
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">{cert.title}</h3>
              <p className="text-[11px] text-[#A1A1AA] font-mono">{cert.skills}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
