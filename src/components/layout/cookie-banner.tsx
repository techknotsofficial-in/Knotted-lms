"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Cookie,
  X,
  SlidersHorizontal,
  Check,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Cookie Categories
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("knotted_cookie_consent");
    if (!consent) {
      // Delay slightly for smooth fade-in
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAcceptAll() {
    localStorage.setItem(
      "knotted_cookie_consent",
      JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() })
    );
    setIsVisible(false);
    setShowSettings(false);
  }

  function handleRejectAll() {
    localStorage.setItem(
      "knotted_cookie_consent",
      JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() })
    );
    setIsVisible(false);
    setShowSettings(false);
  }

  function handleSavePreferences() {
    localStorage.setItem(
      "knotted_cookie_consent",
      JSON.stringify({
        necessary: true,
        analytics: analyticsCookies,
        marketing: marketingCookies,
        timestamp: Date.now(),
      })
    );
    setIsVisible(false);
    setShowSettings(false);
  }

  if (!isVisible && !showSettings) {
    return null;
  }

  return (
    <>
      {/* 1. Main Cookie Banner (Exact Match to Screenshot) */}
      {isVisible && !showSettings && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-2xl border-2 border-[#09090B]/80 bg-[#FAFAF8] text-[#09090B] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-2">
              <p className="text-sm md:text-base font-medium text-[#18181B] leading-relaxed">
                We use cookies to ensure you get the best experience on our website.
              </p>
              <div>
                <Link
                  href="/courses"
                  className="text-sm font-semibold text-[#18181B] hover:text-[#09090B] underline underline-offset-4"
                >
                  Cookies Policy
                </Link>
              </div>
            </div>

            {/* Bottom Actions Row (Exact Screenshot Button Placement) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSettings(true)}
                className="bg-white border-[#09090B] text-[#09090B] hover:bg-[#F4F4F5] text-xs sm:text-sm font-semibold h-11 px-5 rounded-xl shadow-xs"
              >
                Cookies Settings
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleRejectAll}
                  className="bg-[#1E3A5F] hover:bg-[#152943] text-white text-xs sm:text-sm font-semibold h-11 px-6 rounded-xl shadow-md transition-all flex-1 sm:flex-none"
                >
                  Reject All
                </Button>

                <Button
                  type="button"
                  variant="default"
                  onClick={handleAcceptAll}
                  className="bg-[#1E3A5F] hover:bg-[#152943] text-white text-xs sm:text-sm font-semibold h-11 px-6 rounded-xl shadow-md transition-all flex-1 sm:flex-none"
                >
                  Accept All Cookies
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Detailed Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#E4E4E7] bg-white text-[#09090B] shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F4F4F5] flex items-center justify-center text-[#09090B] border border-[#E4E4E7]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[#09090B]">Cookie Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-[#71717A] hover:text-[#09090B] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#71717A] leading-relaxed">
              Customize which categories of cookies you allow while using Knotted LMS. Essential authentication and edge security tokens cannot be disabled.
            </p>

            <div className="space-y-3">
              {/* Essential Cookies (Always Active) */}
              <div className="p-4 rounded-2xl border border-[#E4E4E7] bg-[#F4F4F5]/60 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#09090B] flex items-center gap-1.5">
                    <span>Strictly Necessary & Auth Cookies</span>
                    <span className="text-[10px] bg-[#E4E4E7] text-[#09090B] px-2 py-0.5 rounded-full font-semibold">Required</span>
                  </h4>
                  <p className="text-[11px] text-[#71717A]">
                    Better Auth sessions, Arcjet WAF bot defense, and video playback tokens.
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#09090B] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="p-4 rounded-2xl border border-[#E4E4E7] bg-white flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <h4 className="text-xs font-bold text-[#09090B]">Performance & Analytics</h4>
                  <p className="text-[11px] text-[#71717A]">
                    Help us improve curriculum engagement and monitor streaming latency.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsCookies}
                  onChange={(e) => setAnalyticsCookies(e.target.checked)}
                  className="w-5 h-5 accent-[#09090B] rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="p-4 rounded-2xl border border-[#E4E4E7] bg-white flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <h4 className="text-xs font-bold text-[#09090B]">Marketing & Cohort Updates</h4>
                  <p className="text-[11px] text-[#71717A]">
                    Receive customized workshop announcements and new masterclass alerts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={marketingCookies}
                  onChange={(e) => setMarketingCookies(e.target.checked)}
                  className="w-5 h-5 accent-[#09090B] rounded cursor-pointer shrink-0"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="text-xs font-semibold rounded-xl"
              >
                Reject Non-Essential
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSavePreferences}
                className="bg-[#09090B] text-white hover:bg-[#27272A] text-xs font-bold rounded-xl px-5"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
