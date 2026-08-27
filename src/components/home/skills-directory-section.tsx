import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SKILL_COLUMNS = [
  {
    category: "AI & Machine Learning",
    highlight: "Autonomous Agent Systems",
    items: [
      { name: "Multi-Agent System Design", learners: "42,800+ learners", query: "Artificial Intelligence" },
      { name: "Tool Calling & State Machines", learners: "28,400+ learners", query: "Artificial Intelligence" },
      { name: "Retrieval Augmented Generation (RAG)", learners: "36,200+ learners", query: "Artificial Intelligence" },
      { name: "Large Language Model Workflows", learners: "19,500+ learners", query: "Artificial Intelligence" },
    ],
  },
  {
    category: "Full-Stack Development",
    highlight: "Modern Server Architectures",
    items: [
      { name: "Server Actions & React Architecture", learners: "64,100+ learners", query: "Full-Stack Development" },
      { name: "TypeScript & Type-Safe APIs", learners: "52,300+ learners", query: "Full-Stack Development" },
      { name: "Relational Database Engineering", learners: "39,800+ learners", query: "Full-Stack Development" },
      { name: "Design Systems & UI Engineering", learners: "47,600+ learners", query: "UI/UX Engineering" },
    ],
  },
  {
    category: "Cloud & Scalable Storage",
    highlight: "High-Performance Systems",
    items: [
      { name: "Direct Cloud Storage Pipelines", learners: "31,900+ learners", query: "Cloud Architecture" },
      { name: "Database Connection Pooling", learners: "24,500+ learners", query: "Cloud Architecture" },
      { name: "High-Throughput Object Storage", learners: "29,400+ learners", query: "Cloud Architecture" },
      { name: "Edge Caching & Global CDNs", learners: "18,200+ learners", query: "Cloud Architecture" },
    ],
  },
  {
    category: "Security & Architecture",
    highlight: "Production Hardening",
    items: [
      { name: "Web Application Defense Systems", learners: "16,400+ learners", query: "Edge Security" },
      { name: "Digital Content Watermarking", learners: "12,900+ learners", query: "Edge Security" },
      { name: "Cryptographic Signed Token Streaming", learners: "15,800+ learners", query: "Edge Security" },
      { name: "Secure Authentication Workflows", learners: "21,300+ learners", query: "Edge Security" },
    ],
  },
];

export function SkillsDirectorySection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12 space-y-8 border-t border-[#E4E4E7]">
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans tracking-tight">
          Popular Engineering Skills & Technologies
        </h2>
        <p className="text-xs sm:text-sm text-[#71717A]">
          Explore specific architectural competencies mastered by Knotted learners.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {SKILL_COLUMNS.map((col) => (
          <div key={col.category} className="space-y-4">
            <div className="space-y-0.5 border-b border-[#E4E4E7] pb-2">
              <h3 className="text-sm font-bold text-[#09090B]">{col.category}</h3>
              <p className="text-[11px] font-mono text-[#71717A]">{col.highlight}</p>
            </div>

            <ul className="space-y-3">
              {col.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={`/courses?category=${encodeURIComponent(item.query)}`}
                    className="group block space-y-0.5"
                  >
                    <span className="text-xs font-bold text-[#09090B] group-hover:text-black group-hover:underline underline-offset-2 transition-colors flex items-center justify-between">
                      <span>{item.name}</span>
                      <ArrowRight className="w-3 h-3 text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-[10px] text-[#71717A] font-mono block">
                      {item.learners}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
