"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface WatermarkOverlayProps {
  userEmail: string;
  userId: string;
  className?: string;
}

export function WatermarkOverlay({
  userEmail,
  userId,
  className,
}: WatermarkOverlayProps) {
  const [position, setPosition] = useState({ top: "20%", left: "20%" });
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    // Update timestamp every second
    const updateTime = () => {
      const now = new Date();
      setTimestamp(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Randomize watermark position every 7 seconds to thwart crop tools
    const posInterval = setInterval(() => {
      const randomTop = Math.floor(15 + Math.random() * 65); // 15% to 80%
      const randomLeft = Math.floor(10 + Math.random() * 60); // 10% to 70%
      setPosition({ top: `${randomTop}%`, left: `${randomLeft}%` });
    }, 7000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(posInterval);
    };
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none select-none z-30 overflow-hidden",
        className
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Floating Dynamic Watermark Node */}
      <div
        className="absolute transition-all duration-1000 ease-in-out p-2 rounded-lg bg-black/10 backdrop-blur-[1px] border border-white/5"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className="text-[11px] font-mono font-bold tracking-wider text-white/35 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-tight space-y-0.5">
          <p className="flex items-center gap-1">
            <span>Knotted Secured</span>
            <span>•</span>
            <span className="text-[#10B981]/50">{userEmail}</span>
          </p>
          <p className="text-[9px] text-white/25">
            UID: {userId.slice(0, 10)}... • {timestamp}
          </p>
        </div>
      </div>

      {/* Static Subdued Corner Anchor */}
      <div className="absolute bottom-3 right-4 text-[10px] font-mono font-semibold text-white/20 drop-shadow-md">
        Knotted • {userEmail}
      </div>
    </div>
  );
}
