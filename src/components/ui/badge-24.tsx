"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Badge24Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "success" | "neutral" | "warning";
  pulse?: boolean;
  icon?: React.ReactNode;
}

export function Badge24({
  children,
  className,
  variant = "default",
  pulse = true,
  icon,
  ...props
}: Badge24Props) {
  const dotColors = {
    default: "bg-[#09090B]",
    success: "bg-emerald-500",
    neutral: "bg-zinc-500",
    warning: "bg-amber-500",
  }[variant];

  const pulseColors = {
    default: "bg-[#09090B]/30",
    success: "bg-emerald-500/30",
    neutral: "bg-zinc-500/30",
    warning: "bg-amber-500/30",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#E4E4E7] text-[#09090B] shadow-xs transition-all duration-200 hover:border-[#71717A] hover:bg-[#F4F4F5]/50 select-none",
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              pulseColors
            )}
          />
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", dotColors)}
          />
        </span>
      )}
      {icon && <span className="text-[#71717A]">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
