"use client";

import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getPresignedUploadAction } from "@/actions/storage";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Code2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RichTextEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  className?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  content = "",
  placeholder = "Write comprehensive lesson content, add code examples, or insert diagrams...",
  onChange,
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const [imageUploading, setImageUploading] = useState(false);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class:
              "rounded-xl bg-[#09090B] text-[#E4E4E7] p-4 font-mono text-sm border border-[#27272A] my-4 overflow-x-auto",
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class:
            "rounded-2xl max-w-full h-auto border border-[#E4E4E7] my-4 shadow-sm",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#09090B] underline font-semibold hover:text-black",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc max-w-none focus:outline-none min-h-[260px] p-6 text-[#09090B] text-base leading-relaxed selection:bg-[#09090B]/10",
      },
    },
  });

  if (!editor) {
    return (
      <div className="h-64 rounded-2xl border border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-center text-[#71717A] text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#09090B]" />
        Loading Editor...
      </div>
    );
  }

  // Handle direct inline image upload to Cloudflare R2
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const { uploadUrl, publicUrl } = await getPresignedUploadAction({
        fileName: file.name,
        fileType: file.type || "image/png",
        fileSize: file.size,
        purpose: "lesson_attachment",
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "image/png");
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
        xhr.onerror = () => resolve();
        xhr.send(file);
      });

      editor?.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
    } catch (err) {
      console.error("Failed to insert inline image:", err);
    } finally {
      setImageUploading(false);
    }
  }

  function handleSetLink() {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
      setLinkInputOpen(false);
      return;
    }

    const formattedUrl = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    editor?.chain().focus().setLink({ href: formattedUrl }).run();
    setLinkUrl("");
    setLinkInputOpen(false);
  }

  const wordCount = editor.storage.characterCount?.words?.() || editor.getText().split(/\s+/).filter(Boolean).length;
  const charCount = editor.getText().length;

  return (
    <div
      className={cn(
        "rounded-3xl border border-[#E4E4E7] bg-white overflow-hidden shadow-xs transition-all duration-200 focus-within:border-[#09090B] focus-within:ring-2 focus-within:ring-[#09090B]/10",
        className
      )}
    >
      {/* Top Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-[#F4F4F5] border-b border-[#E4E4E7]">
          <div className="flex flex-wrap items-center gap-1">
            {/* Bold */}
            <Button
              type="button"
              variant={editor.isActive("bold") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("bold") && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-4 h-4" />
            </Button>

            {/* Italic */}
            <Button
              type="button"
              variant={editor.isActive("italic") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("italic") && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-4 h-4" />
            </Button>

            {/* Strike */}
            <Button
              type="button"
              variant={editor.isActive("strike") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("strike") && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="w-4 h-4" />
            </Button>

            {/* Inline Code */}
            <Button
              type="button"
              variant={editor.isActive("code") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("code") && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="w-4 h-4" />
            </Button>

            <div className="h-4 w-px bg-[#E4E4E7] mx-1" />

            {/* Heading 1 */}
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("heading", { level: 1 }) && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="w-4 h-4" />
            </Button>

            {/* Heading 2 */}
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("heading", { level: 2 }) && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="w-4 h-4" />
            </Button>

            {/* Heading 3 */}
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("heading", { level: 3 }) && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="w-4 h-4" />
            </Button>

            <div className="h-4 w-px bg-[#E4E4E7] mx-1" />

            {/* Bullet List */}
            <Button
              type="button"
              variant={editor.isActive("bulletList") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("bulletList") && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="w-4 h-4" />
            </Button>

            {/* Ordered List */}
            <Button
              type="button"
              variant={editor.isActive("orderedList") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("orderedList") && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            {/* Blockquote */}
            <Button
              type="button"
              variant={editor.isActive("blockquote") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("blockquote") && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="w-4 h-4" />
            </Button>

            {/* Code Block */}
            <Button
              type="button"
              variant={editor.isActive("codeBlock") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("codeBlock") && "bg-[#09090B] text-white")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <Code2 className="w-4 h-4" />
            </Button>

            <div className="h-4 w-px bg-[#E4E4E7] mx-1" />

            {/* Link */}
            <Button
              type="button"
              variant={editor.isActive("link") ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 w-8 p-0 rounded-lg", editor.isActive("link") && "bg-[#09090B] text-white")}
              onClick={() => setLinkInputOpen(!linkInputOpen)}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>

            {/* Image Upload Input */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={imageUploading}
              />
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[#09090B] hover:bg-[#E4E4E7] transition-colors">
                {imageUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              </div>
            </label>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Link Input Bar */}
      {linkInputOpen && (
        <div className="p-3 bg-white border-b border-[#E4E4E7] flex items-center gap-2 animate-in fade-in-50">
          <Input
            type="url"
            placeholder="https://example.com/documentation"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="h-9 text-xs rounded-xl"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSetLink();
              }
            }}
          />
          <Button variant="default" size="sm" onClick={handleSetLink} className="h-9 px-4 text-xs font-bold bg-[#09090B] text-white rounded-xl">
            Set Link
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLinkInputOpen(false)} className="h-9 px-3 text-xs rounded-xl">
            Cancel
          </Button>
        </div>
      )}

      {/* TipTap Document Viewport */}
      <EditorContent editor={editor} />

      {/* Footer Meter Bar */}
      {!readOnly && (
        <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E4E4E7] flex items-center justify-between text-[11px] text-[#71717A] font-mono">
          <div className="flex items-center gap-3">
            <span>{wordCount} Words</span>
            <span>{charCount} Characters</span>
          </div>
          <span className="text-emerald-600 font-semibold">Autosave Ready</span>
        </div>
      )}
    </div>
  );
}
