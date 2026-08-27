"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createLiveSessionAction,
  startLiveBroadcastAction,
  endLiveSessionAction,
} from "@/actions/live";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Radio,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Users,
  StopCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseOption {
  id: string;
  title: string;
  category: string;
}

interface ExistingSession {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMin: number;
  isLive: boolean;
  isEnded: boolean;
  course: {
    title: string;
    slug: string;
  };
  attendeesCount: number;
}

interface CreatorLiveClientProps {
  courses: CourseOption[];
  existingSessions: ExistingSession[];
}

export function CreatorLiveClient({ courses, existingSessions }: CreatorLiveClientProps) {
  const router = useRouter();

  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState(
    new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [durationMin, setDurationMin] = useState("60");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !courseId.trim()) {
      setError("Please select a target masterclass and provide a workshop title.");
      return;
    }

    setLoading(true);
    try {
      const res = await createLiveSessionAction({
        courseId: courseId.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMin: Number(durationMin) || 60,
      });

      if (res.success && res.sessionId) {
        router.push(`/live/${res.sessionId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to schedule live workshop";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleLive(sessionId: string, currentLive: boolean) {
    setActionInProgress(sessionId);
    try {
      if (currentLive) {
        await endLiveSessionAction(sessionId);
      } else {
        await startLiveBroadcastAction(sessionId);
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle live state:", err);
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* 1. Header Card */}
      <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="mint" className="text-[10px] uppercase font-bold">
              Creator Studio
            </Badge>
            <span className="text-xs text-[#71717A]">Global Cohort Broadcasting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09090B] font-sans">
            Schedule & Broadcast Live Cohorts
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A]">
            Host live coding workshops, architectural walkthroughs, and Q&A sessions with students worldwide.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="text-xs font-bold rounded-xl bg-white border-[#E4E4E7]"
        >
          <Link href="/live">View Public Cohorts Hub →</Link>
        </Button>
      </div>

      {/* 2. Schedule New Cohort Form */}
      <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs space-y-6">
        <div className="border-b border-[#F4F4F5] pb-4">
          <h2 className="text-lg font-bold text-[#09090B]">Create New Live Session</h2>
          <p className="text-xs text-[#71717A]">
            Enrolled students across the globe will be notified and can register with 1-click.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Masterclass Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#09090B]">
              Target Masterclass / Cohort Track
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full h-11 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] px-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#09090B]"
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.category})
                </option>
              ))}
            </select>
          </div>

          {/* Session Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#09090B]">
              Workshop Title
            </label>
            <Input
              placeholder="e.g. Next.js 16 Server Component Deep Dive & Live Code Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-xl bg-[#FAFAFA] text-xs sm:text-sm font-medium"
              required
            />
          </div>

          {/* Workshop Description / Agenda */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#09090B]">
              Workshop Agenda & Notes (Optional)
            </label>
            <textarea
              placeholder="Outline the key topics, demo repositories, and architectural problems you will solve live with students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[90px] p-3 text-xs sm:text-sm bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090B]"
            />
          </div>

          {/* Schedule Date & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#09090B]">
                Start Date & Time (Your Local Time)
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-11 rounded-xl bg-[#FAFAFA]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#09090B]">
                Estimated Duration (Minutes)
              </label>
              <Input
                type="number"
                min={15}
                max={300}
                step={15}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="h-11 rounded-xl bg-[#FAFAFA]"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#09090B] text-white hover:bg-[#27272A] font-bold text-xs sm:text-sm h-11 px-8 rounded-xl shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Scheduling & Initializing Studio...
                </>
              ) : (
                "Schedule & Open Studio"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Existing Cohorts List */}
      <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs space-y-6">
        <div className="border-b border-[#F4F4F5] pb-4">
          <h2 className="text-lg font-bold text-[#09090B]">Your Scheduled & Active Cohorts</h2>
          <p className="text-xs text-[#71717A]">
            Manage your live streams and join the interactive classroom studio.
          </p>
        </div>

        {existingSessions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[#E4E4E7] bg-[#FAFAFA] space-y-2">
            <Video className="w-8 h-8 mx-auto text-[#71717A]" />
            <p className="text-xs font-bold text-[#09090B]">No Live Cohorts Scheduled Yet</p>
            <p className="text-[11px] text-[#71717A]">Use the form above to schedule your first global live workshop.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {existingSessions.map((s) => (
              <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={s.isLive ? "destructive" : "mint"} className="text-[10px] font-bold uppercase">
                      {s.isLive ? "🔴 Live Broadcasting" : s.isEnded ? "Ended" : "Scheduled"}
                    </Badge>
                    <span className="text-[11px] font-mono text-[#71717A]">
                      {new Date(s.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#09090B]">{s.title}</h3>
                  <p className="text-[11px] text-[#71717A] flex items-center gap-2">
                    <span>{s.course.title}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Users className="w-3 h-3 text-[#09090B]" />
                      {s.attendeesCount} Registered Attendees
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-[#09090B] text-white hover:bg-[#27272A] text-xs font-bold rounded-xl"
                    asChild
                  >
                    <Link href={`/live/${s.id}`}>
                      <PlayCircle className="w-4 h-4 mr-1.5" />
                      Enter Studio
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleLive(s.id, s.isLive)}
                    disabled={actionInProgress === s.id}
                    className="text-xs font-semibold rounded-xl bg-white border-[#E4E4E7]"
                  >
                    {s.isLive ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <StopCircle className="w-3.5 h-3.5" />
                        End Stream
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5" />
                        Start Live
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
