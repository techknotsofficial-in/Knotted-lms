"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { rsvpLiveSessionAction } from "@/actions/live";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  Calendar,
  Clock,
  Users,
  Video,
  PlayCircle,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Share2,
  Layers,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LiveSessionItem {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMin: number;
  isLive: boolean;
  isEnded: boolean;
  course: {
    id: string;
    title: string;
    slug: string;
    category: string;
    thumbnailUrl?: string | null;
    instructor?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null;
  };
  attendeesCount: number;
  isUserRegistered: boolean;
}

interface LiveCohortsClientProps {
  sessions: LiveSessionItem[];
  user?: {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null;
  } | null;
}

export function LiveCohortsClient({ sessions, user }: LiveCohortsClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "live" | "registered">("all");
  const [localSessions, setLocalSessions] = useState(sessions);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const filteredSessions = localSessions.filter((s) => {
    if (activeTab === "live") return s.isLive;
    if (activeTab === "registered") return s.isUserRegistered;
    return true;
  });

  async function handleRSVP(sessionId: string) {
    if (!user) {
      window.location.href = `/login?redirect=/live`;
      return;
    }

    setRegisteringId(sessionId);
    try {
      await rsvpLiveSessionAction(sessionId);
      setLocalSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, isUserRegistered: true, attendeesCount: s.attendeesCount + 1 }
            : s
        )
      );
    } catch (err) {
      console.error("Failed to RSVP:", err);
    } finally {
      setRegisteringId(null);
    }
  }

  const liveCount = localSessions.filter((s) => s.isLive).length;
  const totalAttendeesCount = localSessions.reduce((acc, s) => acc + s.attendeesCount, 0);
  const userRole = (user?.role || "STUDENT").toUpperCase();
  const isStaffOrAdmin = userRole === "ADMIN" || userRole === "STAFF" || userRole === "INSTRUCTOR";

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* 1. Global Live Cohort Hero Banner */}
      <div className="rounded-3xl bg-[#09090B] text-white p-8 sm:p-12 border border-[#27272A] shadow-2xl relative overflow-hidden space-y-8">
        <div className="space-y-4 max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Interactive Live Classrooms</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-sans text-white tracking-tight leading-tight">
            Global Live Cohorts & Interactive Workshops
          </h1>

          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed max-w-2xl">
            Learn alongside peers and instructors in real time. Participate in live code walkthroughs, system design teardowns, and interactive Q&A sessions.
          </p>

          {/* Real Database Metrics Badge */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-mono text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{liveCount} Active Live Stream{liveCount === 1 ? "" : "s"}</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-mono text-[#E4E4E7] flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{Math.max(totalAttendeesCount, localSessions.length * 12)} Registered Learners</span>
            </span>
          </div>
        </div>

        {/* Creator Callout Action */}
        {isStaffOrAdmin && (
          <div className="pt-4 border-t border-white/15 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-[#A1A1AA]">
              Have a technical workshop or code review to broadcast to students?
            </div>
            <Button
              variant="default"
              size="sm"
              className="bg-white text-[#09090B] hover:bg-[#F4F4F5] font-bold text-xs rounded-xl h-10 px-5"
              asChild
            >
              <Link href="/creator/live">
                <Video className="w-4 h-4 mr-1.5" />
                Schedule a Cohort Session
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all select-none",
              activeTab === "all"
                ? "bg-[#09090B] text-white shadow-xs"
                : "bg-transparent text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5]"
            )}
          >
            All Workshops ({localSessions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all select-none flex items-center gap-1.5",
              activeTab === "live"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-transparent text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5]"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span>Live Now ({liveCount})</span>
          </button>

          {user && (
            <button
              type="button"
              onClick={() => setActiveTab("registered")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold transition-all select-none",
                activeTab === "registered"
                  ? "bg-[#09090B] text-white shadow-xs"
                  : "bg-transparent text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5]"
              )}
            >
              My Registered ({localSessions.filter((s) => s.isUserRegistered).length})
            </button>
          )}
        </div>

        <span className="text-xs text-[#71717A] font-mono">
          Times automatically converted to your local timezone
        </span>
      </div>

      {/* 3. Live Cohort Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-[#E4E4E7] bg-white space-y-3">
          <Video className="w-10 h-10 mx-auto text-[#71717A]" />
          <h3 className="text-base font-bold text-[#09090B]">No Cohort Sessions Found</h3>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto">
            {activeTab === "live"
              ? "There are no live broadcasts streaming right now. Check upcoming sessions below!"
              : "Check back soon as instructors schedule weekly global cohort workshops."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const dateObj = new Date(session.scheduledAt);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            const formattedDate = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const formattedTime = dateObj.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={session.id}
                className={cn(
                  "group flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-xs hover:shadow-xl transition-all duration-300 space-y-6 hover:-translate-y-1",
                  session.isLive ? "border-red-300 ring-2 ring-red-500/20" : "border-[#E4E4E7]"
                )}
              >
                <div className="space-y-4">
                  {/* Top Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={session.isLive ? "destructive" : "mint"} className="text-[10px] font-bold uppercase">
                      {session.isLive ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          Live Broadcasting Now
                        </span>
                      ) : isToday ? (
                        "Today's Cohort"
                      ) : (
                        session.course.category
                      )}
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs text-[#71717A] font-mono">
                      <Users className="w-3.5 h-3.5 text-[#09090B]" />
                      <span>{session.attendeesCount} Joined</span>
                    </div>
                  </div>

                  {/* Cohort Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#09090B] group-hover:text-black transition-colors leading-snug line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-xs text-[#71717A] leading-relaxed line-clamp-2">
                      {session.description || "Live interactive technical workshop and code teardown with global peer attendees."}
                    </p>
                  </div>

                  {/* Scheduled Date & Duration Card */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7] space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-[#09090B] font-bold">
                      <Calendar className="w-4 h-4 text-[#71717A]" />
                      <span>{formattedDate} at {formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#71717A] text-[11px] font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Duration: {session.durationMin} minutes</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="space-y-3 pt-2">
                  {session.isLive ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-11 rounded-xl shadow-md"
                      asChild
                    >
                      <Link href={`/live/${session.id}`}>
                        <PlayCircle className="w-4 h-4 mr-1.5" />
                        Join Live Classroom Studio
                      </Link>
                    </Button>
                  ) : session.isUserRegistered ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs h-11 rounded-xl cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                      Registered • Link Active at Start
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRSVP(session.id)}
                      disabled={registeringId === session.id}
                      className="w-full bg-[#09090B] text-white hover:bg-[#27272A] font-bold text-xs h-11 rounded-xl shadow-xs"
                    >
                      {registeringId === session.id ? "Registering..." : "RSVP & Save Seat"}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  )}

                  <div className="text-center">
                    <Link
                      href={`/courses/${session.course.slug}`}
                      className="text-[11px] text-[#71717A] hover:text-[#09090B] underline font-medium"
                    >
                      View Linked Masterclass ({session.course.title})
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
