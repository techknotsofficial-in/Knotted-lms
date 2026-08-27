import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  href?: string;
}

export function Logo({
  className,
  size = "default",
  showText = true,
  href = "/",
}: LogoProps) {
  const iconPixelSizes = {
    sm: 28,
    default: 36,
    lg: 48,
  }[size];

  const textSizes = {
    sm: "text-lg",
    default: "text-2xl",
    lg: "text-3xl",
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none group", className)}>
      <div
        className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105 rounded-xl overflow-hidden shadow-xs border border-[#E4E4E7] bg-white p-1"
        style={{ width: iconPixelSizes, height: iconPixelSizes }}
      >
        <Image
          src="/knotted_lms_icon.png"
          alt="Knotted LMS Logo"
          width={iconPixelSizes}
          height={iconPixelSizes}
          className="object-contain w-full h-full"
          priority
        />
      </div>

      {showText && (
        <span
          className={cn(
            "font-extrabold tracking-tight text-[#09090B] font-sans transition-colors",
            textSizes
          )}
        >
          Knotted<span className="text-[#71717A]">.</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
