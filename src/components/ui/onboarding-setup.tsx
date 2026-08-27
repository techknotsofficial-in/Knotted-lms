"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Badge24 } from "@/components/ui/badge-24";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Sparkles,
  BookOpen,
  Video,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Code2,
  Cloud,
  Shield,
  Palette,
  Terminal,
  Zap,
  Bell,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingSetupProps {
  initialUser?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onComplete?: () => void;
}

const TOPICS = [
  { id: "fullstack", label: "Full-Stack Development", icon: Code2, desc: "Next.js, Node.js, React" },
  { id: "cloud", label: "Cloud & Edge Infrastructure", icon: Cloud, desc: "Cloudflare R2, AWS, Docker" },
  { id: "security", label: "Edge Security & DRM", icon: Shield, desc: "Arcjet, WAF, Watermarking" },
  { id: "systems", label: "Distributed Architecture", icon: Terminal, desc: "Postgres, Redis, Microservices" },
  { id: "uiux", label: "Design Systems & UI/UX", icon: Palette, desc: "Tailwind, Motion, Figma" },
  { id: "live", label: "Live Cohorts & Workshops", icon: Video, desc: "WebRTC stages, interactive labs" },
];

const ROLES = [
  { id: "STUDENT", label: "Software Engineer / Student", desc: "I want to master technical masterclasses & earn certificates" },
  { id: "INSTRUCTOR", label: "Technical Creator / Instructor", desc: "I want to author curriculums & broadcast live cohort classes" },
  { id: "TEAM_LEAD", label: "Engineering Lead / Manager", desc: "I want to upskill my engineering team & track verified progress" },
];

export function OnboardingSetup({ initialUser, onComplete }: OnboardingSetupProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form State
  const [name, setName] = useState(initialUser?.name || "");
  const [selectedRole, setSelectedRole] = useState("STUDENT");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["fullstack", "cloud"]);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleTopic(id: string) {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    setIsSubmitting(true);
    // Simulate updating user profile / preferences
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);

    // Mark onboarding as completed for this user
    if (typeof window !== "undefined") {
      localStorage.setItem("knotted_onboarding_completed", "true");
      document.cookie = "knotted_onboarded=1; path=/; max-age=31536000";
    }

    if (onComplete) {
      onComplete();
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-[#E4E4E7] bg-white shadow-2xl overflow-hidden">
      {/* Top Header & Multi-Step Progress Indicator */}
      <div className="p-6 sm:p-8 border-b border-[#F4F4F5] bg-[#FAFAFA]/50 space-y-4">
        <div className="flex items-center justify-between">
          <Badge24 variant="success" pulse={true} className="text-[11px] font-bold">
            First-Time Setup • Step {step} of {totalSteps}
          </Badge24>
          <span className="text-xs font-mono font-bold text-[#71717A]">
            {Math.round((step / totalSteps) * 100)}% Completed
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-1.5 bg-[#E4E4E7] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#09090B]"
            initial={{ width: "33%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* First-Time User Suggestions Notice Banner */}
      <div className="mx-6 sm:mx-10 mt-6 p-3.5 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7] flex items-center gap-3">
        <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-[#09090B] shrink-0 border border-[#E4E4E7] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#09090B]" />
        </div>
        <p className="text-[11px] text-[#71717A] leading-relaxed">
          <strong className="text-[#09090B]">First-time setup:</strong> Your preferences below will help curate personalized technical masterclasses and workshop recommendations for your workspace.
        </p>
      </div>

      {/* Step Content with Animated Framer Motion Transitions */}
      <div className="p-6 sm:p-10 min-h-[420px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <h2 className="text-2xl font-extrabold text-[#09090B] font-sans">
                  Welcome to Knotted! What should we call you?
                </h2>
                <p className="text-xs sm:text-sm text-[#71717A]">
                  Let&apos;s personalize your learner profile and certificates.
                </p>
              </div>

              <div className="space-y-4">
                {/* Full Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#09090B]">
                    Full Name (used for verifiable certificates)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-sm bg-[#F4F4F5] border-[#E4E4E7] focus:bg-white rounded-xl"
                    autoFocus
                  />
                </div>

                {/* Primary Role Selector */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-[#09090B]">
                    Select your primary learning goal
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {ROLES.map((role) => {
                      const isSelected = selectedRole === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRole(role.id)}
                          className={cn(
                            "flex items-start gap-3.5 p-3.5 rounded-2xl border text-left transition-all",
                            isSelected
                              ? "border-[#09090B] bg-[#F4F4F5] shadow-xs"
                              : "border-[#E4E4E7] bg-white hover:border-[#A1A1AA]"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                              isSelected
                                ? "border-[#09090B] bg-[#09090B] text-white"
                                : "border-[#D4D4D8] bg-white"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#09090B]">{role.label}</h4>
                            <p className="text-[11px] text-[#71717A]">{role.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <h2 className="text-2xl font-extrabold text-[#09090B] font-sans">
                  What topics do you want to master?
                </h2>
                <p className="text-xs sm:text-sm text-[#71717A]">
                  Choose topics to customize your course recommendations and live workshops.
                </p>
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = selectedTopics.includes(topic.id);

                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic.id)}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all",
                        isSelected
                          ? "border-[#09090B] bg-[#F4F4F5] shadow-xs"
                          : "border-[#E4E4E7] bg-white hover:border-[#A1A1AA]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                          isSelected
                            ? "bg-[#09090B] text-white border-[#09090B]"
                            : "bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#09090B]">{topic.label}</h4>
                        <p className="text-[11px] text-[#71717A] leading-tight pt-0.5">{topic.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Experience Level */}
              <div className="space-y-2 pt-2 border-t border-[#F4F4F5]">
                <label className="block text-xs font-bold text-[#09090B]">
                  Your current experience level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all",
                        experienceLevel === lvl
                          ? "border-[#09090B] bg-[#09090B] text-white shadow-xs"
                          : "border-[#E4E4E7] bg-white text-[#71717A] hover:bg-[#F4F4F5]"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <h2 className="text-2xl font-extrabold text-[#09090B] font-sans">
                  You&apos;re ready to begin!
                </h2>
                <p className="text-xs sm:text-sm text-[#71717A]">
                  Review your setup and enter your personalized learning workspace.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#09090B] text-white flex items-center justify-center font-bold text-sm">
                      {name ? name.charAt(0).toUpperCase() : "K"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#09090B]">{name || "Learner"}</h4>
                      <p className="text-[11px] text-[#71717A] capitalize">
                        {selectedRole.replace("_", " ")} • {experienceLevel}
                      </p>
                    </div>
                  </div>
                  <Badge variant="mint" className="text-[10px] font-bold">
                    Setup Complete
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
                    Selected Focus Areas ({selectedTopics.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTopics.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E4E4E7] text-[11px] font-bold text-[#09090B]"
                      >
                        {TOPICS.find((item) => item.id === t)?.label || t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#E4E4E7] bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#09090B]">Live Cohort & Lesson Reminders</h4>
                    <p className="text-[10px] text-[#71717A]">Receive emails when instructors go live or issue certificates</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 accent-[#09090B] rounded cursor-pointer"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 border-t border-[#F4F4F5] mt-6">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
              className="text-xs font-bold rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !name.trim()}
              className="bg-[#09090B] text-white hover:bg-[#27272A] text-xs font-bold rounded-xl px-6"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="bg-[#09090B] text-white hover:bg-[#27272A] text-xs font-bold rounded-xl px-8 h-10 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Finalizing Workspace...
                </>
              ) : (
                <>
                  Launch My Dashboard
                  <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
