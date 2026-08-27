"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DRMShieldProps {
  userEmail: string;
  userId: string;
}

export function DRMShield({ userEmail, userId }: DRMShieldProps) {
  const [position, setPosition] = useState({ top: "20%", left: "20%" });
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    // 1. Live Timestamp
    const updateTime = () => {
      const now = new Date();
      setTimestamp(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // 2. Subtle, smooth position drift every 8 seconds
    const posInterval = setInterval(() => {
      const randomTop = Math.floor(15 + Math.random() * 65); // 15% to 80%
      const randomLeft = Math.floor(10 + Math.random() * 60); // 10% to 70%
      setPosition({ top: `${randomTop}%`, left: `${randomLeft}%` });
    }, 8000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(posInterval);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Gentle, Premium Floating Learner Watermark (Subtle & Non-Intrusive) */}
      <div
        className="absolute transition-all duration-1000 ease-in-out px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-[1px] border border-white/5"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className="text-[10px] font-mono font-medium tracking-wide text-white/30 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          <span className="text-white/40">{userEmail}</span>
          <span className="text-white/20">•</span>
          <span className="text-white/25">{timestamp}</span>
        </div>
      </div>

      {/* Subdued Bottom Corner ID */}
      <div className="absolute bottom-3 right-4 text-[9px] font-mono text-white/20 drop-shadow-sm">
        Knotted • {userEmail}
      </div>
    </div>
  );
}
