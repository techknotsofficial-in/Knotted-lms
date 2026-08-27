import React from "react";
import { cn } from "@/lib/utils";

interface RichTextViewerProps {
  content: string;
  className?: string;
}

export function RichTextViewer({ content, className }: RichTextViewerProps) {
  if (!content) {
    return (
      <div className="p-8 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] text-center text-xs text-[#71717A]">
        No text content provided for this lesson.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-zinc max-w-none text-[#09090B] leading-relaxed font-sans",
        // Heading styles
        "[&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-[#09090B] [&_h1]:mb-4",
        "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#09090B] [&_h2]:mt-8 [&_h2]:mb-3",
        "[&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#09090B] [&_h3]:mt-6 [&_h3]:mb-2",
        // Paragraph and text styles
        "[&_p]:mb-4 [&_p]:text-sm sm:[&_p]:text-base [&_p]:text-[#3F3F46]",
        // Code styling
        "[&_pre]:rounded-2xl [&_pre]:bg-[#09090B] [&_pre]:text-[#E4E4E7] [&_pre]:p-5 [&_pre]:border [&_pre]:border-[#27272A] [&_pre]:my-6 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto",
        "[&_code]:bg-[#F4F4F5] [&_code]:text-[#09090B] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs [&_code]:font-bold",
        // Blockquote styling
        "[&_blockquote]:border-l-4 [&_blockquote]:border-[#09090B] [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:text-[#09090B] [&_blockquote]:my-4 [&_blockquote]:bg-[#F4F4F5] [&_blockquote]:rounded-r-xl",
        // Lists
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul_li]:mb-1",
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol_li]:mb-1",
        // Links
        "[&_a]:text-[#09090B] [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-black",
        // Images
        "[&_img]:rounded-2xl [&_img]:border [&_img]:border-[#E4E4E7] [&_img]:my-6 [&_img]:shadow-sm",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
