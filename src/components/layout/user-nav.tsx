"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { resolveMediaUrlAction } from "@/actions/storage";
import { Badge } from "@/components/ui/badge";
import {
  User,
  BookOpen,
  LayoutDashboard,
  Video,
  LogOut,
  ChevronDown,
  Layers,
  BarChart3,
  HardDrive,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserNavProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.image || null);
  const [imageError, setImageError] = useState(false);

  const userRole = (user.role || "STUDENT").toUpperCase();
  const isStaffOrAdmin = userRole === "ADMIN" || userRole === "STAFF" || userRole === "INSTRUCTOR";

  // Resolve private storage tokens for avatar
  useEffect(() => {
    let isMounted = true;
    if (user.image) {
      if (user.image.startsWith("http") && !user.image.includes(".r2.dev") && !user.image.includes("r2.cloudflarestorage.com")) {
        setAvatarUrl(user.image);
      } else {
        resolveMediaUrlAction(user.image).then((signed) => {
          if (isMounted && signed) {
            setAvatarUrl(signed);
          }
        }).catch(() => {});
      }
    } else {
      setAvatarUrl(null);
    }
    return () => {
      isMounted = false;
    };
  }, [user.image]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } catch (err) {
      console.warn("Sign out client error, clearing cookies manually:", err);
    } finally {
      if (typeof document !== "undefined") {
        document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      window.location.href = "/login";
    }
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[#F4F4F5] transition-colors border border-[#E4E4E7] focus:outline-none focus:ring-2 focus:ring-[#09090B]"
        aria-expanded={isOpen}
      >
        {avatarUrl && !imageError ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#E4E4E7] bg-[#F4F4F5]">
            <Image
              src={avatarUrl}
              alt={user.name || "User Avatar"}
              fill
              sizes="32px"
              unoptimized
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#09090B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {initial}
          </div>
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#71717A] transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E4E4E7] bg-white shadow-xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
          {/* User Info Header */}
          <div className="p-3 border-b border-[#F4F4F5] space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#09090B] truncate">
                {user.name || "Knotted Learner"}
              </p>
              <Badge variant="mint" className="text-[10px] uppercase font-bold">
                {userRole}
              </Badge>
            </div>
            <p className="text-xs text-[#71717A] truncate">{user.email}</p>
          </div>

          {/* Navigation Links */}
          <div className="py-2 space-y-1 text-xs">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#09090B] hover:bg-[#F4F4F5] font-medium transition-colors"
            >
              <User className="w-4 h-4 text-[#71717A]" />
              <span>Profile & Account</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#09090B] hover:bg-[#F4F4F5] font-medium transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#71717A]" />
              <span>Learner Dashboard</span>
            </Link>

            <Link
              href="/courses"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#09090B] hover:bg-[#F4F4F5] font-medium transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#71717A]" />
              <span>Explore Courses</span>
            </Link>

            <Link
              href="/live"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#09090B] hover:bg-[#F4F4F5] font-medium transition-colors"
            >
              <Video className="w-4 h-4 text-[#71717A]" />
              <span>Live Cohorts</span>
            </Link>

            {/* CREATOR STUDIO: ONLY VISIBLE TO ADMIN & STAFF */}
            {isStaffOrAdmin && (
              <div className="pt-2 mt-2 border-t border-[#F4F4F5] space-y-1">
                <span className="px-3 text-[10px] font-bold text-[#71717A] uppercase tracking-wider">
                  Company Admin & Staff
                </span>
                <Link
                  href="/creator/courses"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#09090B] hover:bg-[#F4F4F5] font-bold transition-colors"
                >
                  <Layers className="w-4 h-4 text-[#09090B]" />
                  <span>Creator Studio</span>
                </Link>
                <Link
                  href="/creator/analytics"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#09090B] hover:bg-[#F4F4F5] font-bold transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-[#09090B]" />
                  <span>Analytics & Revenue</span>
                </Link>
                <Link
                  href="/creator/media"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#09090B] hover:bg-[#F4F4F5] font-bold transition-colors"
                >
                  <HardDrive className="w-4 h-4 text-[#09090B]" />
                  <span>Cloudflare R2 Media</span>
                </Link>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-[#F4F4F5]">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
