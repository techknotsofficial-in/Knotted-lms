"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Sparkles, ArrowRight } from "lucide-react";

export function PromoBar() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="w-full bg-[#E0F2FE] border-b border-[#BAE6FD] text-[#0369A1] px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all">
      <div className="flex-1 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
        <span>
          <strong className="text-[#0C4A6E]">1 day left!</strong> Limited-time enrollment open. Master Full-Stack, Cloud & AI Engineering starting from ₹0.00 / Free Preview.
        </span>
        <Link
          href="/courses"
          className="hidden sm:inline-flex items-center gap-1 text-[#0284C7] hover:text-[#0C4A6E] underline underline-offset-2 ml-1 font-bold"
        >
          Explore Masterclasses
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="p-1 rounded-md text-[#0369A1] hover:text-[#0C4A6E] hover:bg-[#BAE6FD]/40 transition-colors ml-2"
        aria-label="Dismiss promo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
