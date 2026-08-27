"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";
import {
  Search,
  ChevronDown,
  Globe,
  ShoppingCart,
  BookOpen,
  Video,
  Layers,
  Sparkles,
  ArrowRight,
  Code,
  Shield,
  Cloud,
  Cpu,
  Palette,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EXPLORE_CATEGORIES = [
  { name: "Artificial Intelligence (AI)", icon: Cpu, query: "Artificial Intelligence" },
  { name: "Full-Stack Development", icon: Code, query: "Full-Stack Development" },
  { name: "Cloud Architecture", icon: Cloud, query: "Cloud Architecture" },
  { name: "Edge Security", icon: Shield, query: "Edge Security" },
  { name: "UI/UX Engineering", icon: Palette, query: "UI/UX Engineering" },
  { name: "Networking & Systems", icon: Network, query: "Networking" },
];

interface MainNavProps {
  user?: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string | null;
  } | null;
}

export function MainNav({ user }: MainNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isGlobeOpen, setIsGlobeOpen] = useState(false);

  const exploreRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);

  const userRole = (user?.role || "STUDENT").toUpperCase();
  const isStaffOrAdmin = userRole === "ADMIN" || userRole === "STAFF" || userRole === "INSTRUCTOR";

  // Handle Search Submission
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/courses");
    }
  }

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setIsExploreOpen(false);
      }
      if (globeRef.current && !globeRef.current.contains(e.target as Node)) {
        setIsGlobeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E4E4E7] shadow-2xs">
      <div className="w-full px-4 sm:px-8 lg:px-12 h-18 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* 1. Left Section: Brand Logo & Explore Dropdown */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Logo size="default" />

          {/* Explore Category Dropdown */}
          <div className="relative" ref={exploreRef}>
            <button
              type="button"
              onClick={() => setIsExploreOpen(!isExploreOpen)}
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors select-none",
                isExploreOpen
                  ? "bg-[#09090B] text-white"
                  : "text-[#09090B] hover:bg-[#F4F4F5]"
              )}
            >
              <span>Explore</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExploreOpen && "rotate-180")} />
            </button>

            {/* Explore Mega Menu */}
            {isExploreOpen && (
              <div className="absolute left-0 mt-3 w-72 rounded-2xl border border-[#E4E4E7] bg-white shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2 text-[10px] font-bold text-[#71717A] uppercase tracking-wider border-b border-[#F4F4F5]">
                  Browse Masterclass Topics
                </div>
                <div className="py-1 space-y-0.5">
                  {EXPLORE_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.name}
                        href={`/courses?category=${encodeURIComponent(cat.query)}`}
                        onClick={() => setIsExploreOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-[#09090B] hover:bg-[#F4F4F5] transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-[#71717A] group-hover:text-[#09090B]" />
                          <span>{cat.name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    );
                  })}
                </div>
                <div className="p-2 border-t border-[#F4F4F5]">
                  <Link
                    href="/courses"
                    onClick={() => setIsExploreOpen(false)}
                    className="block text-center py-2 text-xs font-bold text-[#09090B] hover:bg-[#F4F4F5] rounded-xl transition-colors"
                  >
                    View All Catalog ({EXPLORE_CATEGORIES.length}+ Topics) →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Subscribe / Live Cohorts Link */}
          <Link
            href="/live"
            className="hidden lg:inline-block text-xs font-semibold text-[#09090B] hover:text-[#71717A] transition-colors whitespace-nowrap"
          >
            Live Cohorts
          </Link>
        </div>

        {/* 2. Center Section: Big Rounded Live Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-2 sm:mx-4">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-4 w-4 h-4 text-[#71717A] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for anything (e.g. Next.js, AI Agents, Cloud, Security)..."
              className="w-full h-11 pl-11 pr-4 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-xs sm:text-sm text-[#09090B] placeholder:text-[#71717A] focus:outline-none focus:bg-white focus:border-[#09090B] focus:ring-2 focus:ring-[#09090B]/10 transition-all"
            />
          </div>
        </form>

        {/* 3. Right Section: Creator Studio, Cart, Log in, Sign up, Globe */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Creator Studio / Teach Link */}
          <Link
            href={isStaffOrAdmin ? "/creator/courses" : "/courses"}
            className="hidden xl:inline-block text-xs font-semibold text-[#09090B] hover:text-[#71717A] transition-colors whitespace-nowrap px-2"
          >
            {isStaffOrAdmin ? "Creator Studio" : "Enterprise Training"}
          </Link>

          {/* My Learning / Cart Icon */}
          <Link
            href="/dashboard"
            className="p-2 rounded-full text-[#09090B] hover:bg-[#F4F4F5] transition-colors relative"
            title="My Dashboard & Learning"
          >
            <ShoppingCart className="w-5 h-5 text-[#09090B]" />
          </Link>

          {/* User Auth or Sign In / Sign Up Buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              <UserNav user={user} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 text-xs font-bold rounded-xl bg-white border-[#09090B] text-[#09090B] hover:bg-[#F4F4F5]"
                asChild
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-10 px-5 text-xs font-bold rounded-xl bg-[#09090B] text-white hover:bg-[#27272A] shadow-xs"
                asChild
              >
                <Link href="/login">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Globe / Region Switcher Icon */}
          <div className="relative hidden sm:block" ref={globeRef}>
            <button
              type="button"
              onClick={() => setIsGlobeOpen(!isGlobeOpen)}
              className="p-2 rounded-full border border-[#E4E4E7] text-[#09090B] hover:bg-[#F4F4F5] transition-colors"
              title="Select Language & Region"
            >
              <Globe className="w-4 h-4" />
            </button>

            {isGlobeOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#E4E4E7] bg-white shadow-xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#71717A] uppercase tracking-wider border-b border-[#F4F4F5]">
                  Region & Currency
                </div>
                <div className="py-1 text-xs font-medium space-y-0.5">
                  <div className="px-3 py-1.5 rounded-lg bg-[#F4F4F5] text-[#09090B] font-bold flex items-center justify-between">
                    <span>English (US)</span>
                    <span className="text-[10px] font-mono text-[#71717A]">INR (₹)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
