"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  HardDrive,
  Cookie,
  Globe,
} from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  }

  function reopenCookies() {
    localStorage.removeItem("knotted_cookie_consent");
    window.location.reload();
  }

  return (
    <footer className="w-full bg-[#09090B] text-white border-t border-[#27272A] py-10 px-6 sm:px-12 lg:px-16 xl:px-24 mt-16">
      <div className="w-full space-y-10">
        {/* Main Content Grid Across Entire Screen Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Col 1 & 2: Brand Info & Socials */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 select-none group">
              <div className="w-8 h-8 relative rounded-xl overflow-hidden border border-[#27272A] bg-white p-1 shadow-xs">
                <Image
                  src="/knotted_lms_icon.png"
                  alt="Knotted Logo"
                  width={32}
                  height={32}
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                Knotted<span className="text-[#71717A]">.</span>
              </span>
            </Link>

            <p className="text-xs text-[#A1A1AA] max-w-sm leading-relaxed">
              Enterprise learning platform engineered with Next.js 16, Arcjet WAF bot defense, and zero-egress Cloudflare R2 video delivery.
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              <Link
                href="https://github.com"
                target="_blank"
                className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:border-white/40 transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:border-white/40 transition-colors"
                aria-label="X Twitter"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:border-white/40 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z" />
                </svg>
              </Link>
              <Link
                href="https://discord.com"
                target="_blank"
                className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:border-white/40 transition-colors"
                aria-label="Discord"
              >
                <Globe className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Col 3: Platform & Learning */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Learning
            </h4>
            <ul className="space-y-2 text-xs text-[#A1A1AA]">
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">Course Catalog</Link>
              </li>
              <li>
                <Link href="/live" className="hover:text-white transition-colors">Live Cohorts</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">Learner Dashboard</Link>
              </li>
              <li>
                <Link href="/courses?category=Full-Stack+Development" className="hover:text-white transition-colors">Full-Stack Tracks</Link>
              </li>
              <li>
                <Link href="/courses?category=Cloud+Architecture" className="hover:text-white transition-colors">Cloud & Edge Systems</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Creator & Staff */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Creator Studio
            </h4>
            <ul className="space-y-2 text-xs text-[#A1A1AA]">
              <li>
                <Link href="/creator/courses" className="hover:text-white transition-colors">Curriculum Builder</Link>
              </li>
              <li>
                <Link href="/creator/editor" className="hover:text-white transition-colors">TipTap Rich Text Editor</Link>
              </li>
              <li>
                <Link href="/creator/media" className="hover:text-white transition-colors">Cloudflare R2 Media</Link>
              </li>
              <li>
                <Link href="/creator/analytics" className="hover:text-white transition-colors">Revenue Analytics</Link>
              </li>
              <li>
                <Link href="/creator/live" className="hover:text-white transition-colors">Live Class Scheduler</Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Trust & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-xs text-[#A1A1AA]">
              <li>
                <Link href="/verify/CERT-1001" className="hover:text-white transition-colors">Verify Certificate</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={reopenCookies}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Cookie className="w-3 h-3" />
                  <span>Cookie Preferences</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 6: Compact Integrated Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Curriculum Drops</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Get notified when new live cohorts and technical masterclasses drop.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
              {subscribed ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Subscribed!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="email"
                    placeholder="Work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#18181B] border-[#27272A] focus:bg-[#18181B] text-white placeholder:text-[#71717A] text-xs h-9 rounded-xl"
                    required
                  />
                  <Button
                    type="submit"
                    variant="default"
                    className="bg-white text-[#09090B] hover:bg-[#F4F4F5] font-bold text-xs h-9 px-3.5 rounded-xl shrink-0"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Legal & Security Bar */}
        <div className="pt-6 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <p>© {new Date().getFullYear()} Knotted LMS Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[#A1A1AA]">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              Secured by Arcjet WAF
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-white" />
              0-Egress Cloudflare R2
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
