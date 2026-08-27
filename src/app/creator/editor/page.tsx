"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { RichTextViewer } from "@/components/editor/rich-text-viewer";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  FileCode2 
} from "lucide-react";

export default function CreatorEditorPage() {
  const [title, setTitle] = useState("Architecting High-Scale Distributed Media Systems");
  const [content, setContent] = useState(
    `<h1>Scalable Cloud Architecture</h1><p>In this lesson, we break down how to stream 4K and 1080p video directly from object storage with secure, tokenized URLs.</p><blockquote>Key Takeaway: Presigned URLs allow direct client-to-bucket communication, bypassing server compute bottlenecks.</blockquote><h2>Architecture Blueprint</h2><p>Here is how the signed URL pipeline works with modern Server Actions and session validation:</p><pre><code>// Direct upload execution via S3 Presigned URL\nconst { uploadUrl, publicUrl } = await getPresignedUploadAction({\n  fileName: "lecture-01.mp4",\n  fileType: "video/mp4",\n  purpose: "lesson_video"\n});</code></pre><p>All authenticated students receive time-limited playback tokens, preventing unauthorized deep-linking.</p>`
  );
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "split">("split");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
              <Link href="/creator/courses">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Course Library
              </Link>
            </Button>
            <Logo size="default" />
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center p-1 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "edit" ? "bg-[#09090B] text-white shadow-xs" : "text-[#71717A] hover:text-[#09090B]"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("split")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "split" ? "bg-[#09090B] text-white shadow-xs" : "text-[#71717A] hover:text-[#09090B]"
                }`}
              >
                <Layers className="w-3.5 h-3.5 inline mr-1" />
                Split
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "preview" ? "bg-[#09090B] text-white shadow-xs" : "text-[#71717A] hover:text-[#09090B]"
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Student Preview
              </button>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="bg-[#09090B] text-white hover:bg-[#27272A] rounded-xl text-xs font-bold shadow-xs h-9 px-4"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Lesson
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 space-y-6 w-full">
        {/* Lesson Title Input */}
        <div className="rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="mint" className="text-[10px] uppercase font-bold">Rich Article Studio</Badge>
            <span className="text-xs text-[#71717A]">WYSIWYG Tiptap + Syntax Highlighting</span>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lesson Title..."
            className="text-xl md:text-2xl font-extrabold bg-[#FAFAFA] border-[#E4E4E7] text-[#09090B] h-12 rounded-xl"
          />
        </div>

        {/* Editor Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Editor Column */}
          {(activeTab === "edit" || activeTab === "split") && (
            <div className={activeTab === "edit" ? "lg:col-span-2" : "col-span-1"}>
              <div className="rounded-3xl border border-[#E4E4E7] bg-white shadow-xs overflow-hidden">
                <div className="p-4 bg-[#F4F4F5] border-b border-[#E4E4E7] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Markdown & Rich Text Editor
                  </span>
                  <Badge variant="outline" className="text-[10px] text-[#71717A] bg-white border-[#E4E4E7]">
                    Auto-Formatted
                  </Badge>
                </div>
                <div className="p-6">
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Write deep-dive technical explanations, embed code snippets, tables, and architectural notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Student Preview Column */}
          {(activeTab === "preview" || activeTab === "split") && (
            <div className={activeTab === "preview" ? "lg:col-span-2" : "col-span-1"}>
              <div className="rounded-3xl border border-[#E4E4E7] bg-white shadow-xs overflow-hidden">
                <div className="p-4 bg-[#F4F4F5] border-b border-[#E4E4E7] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Live Student Render Preview
                  </span>
                  <Badge variant="mint" className="text-[10px] uppercase font-bold">
                    Clean Typography
                  </Badge>
                </div>
                <div className="p-8">
                  <RichTextViewer content={content} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
