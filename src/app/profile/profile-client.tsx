"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateUserProfileAction, deleteUserAccountAction } from "@/actions/profile";
import { resolveMediaUrlAction } from "@/actions/storage";
import { authClient } from "@/lib/auth-client";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Sparkles,
  Camera,
  Check,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  BookOpen,
  Award,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 8 Clean Preset Vector Avatars for Instant Selection
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
];

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string | null;
    createdAt: string;
  };
  stats: {
    enrollmentsCount: number;
    completedCount: number;
    badgesCount: number;
    certificatesCount: number;
  };
}

export function ProfileClient({ user, stats }: ProfileClientProps) {
  const router = useRouter();

  // Profile Form State
  const [name, setName] = useState(user.name || "");
  const [selectedImage, setSelectedImage] = useState<string | null>(user.image || null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(user.image || null);
  const [avatarError, setAvatarError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Resolve private storage tokens for avatar display
  useEffect(() => {
    let isMounted = true;
    setAvatarError(false);

    if (selectedImage) {
      if (selectedImage.startsWith("http") && !selectedImage.includes(".r2.dev") && !selectedImage.includes("r2.cloudflarestorage.com")) {
        setDisplayAvatarUrl(selectedImage);
      } else {
        resolveMediaUrlAction(selectedImage).then((signed) => {
          if (isMounted && signed) {
            setDisplayAvatarUrl(signed);
          }
        }).catch(() => {
          if (isMounted) setDisplayAvatarUrl(selectedImage);
        });
      }
    } else {
      setDisplayAvatarUrl(null);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedImage]);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const initial = (name || user.email).charAt(0).toUpperCase();

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      await updateUserProfileAction({
        name: name.trim(),
        image: selectedImage,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);
    try {
      await deleteUserAccountAction();
      await authClient.signOut();
      if (typeof document !== "undefined") {
        document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      window.location.href = "/login";
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeleting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* 1. Header Banner Card */}
      <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Preview with Graceful Error Fallback */}
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#09090B] bg-[#F4F4F5] shrink-0 shadow-sm flex items-center justify-center">
            {displayAvatarUrl && !avatarError ? (
              <Image
                src={displayAvatarUrl}
                alt={name || "User Avatar"}
                fill
                sizes="80px"
                unoptimized
                className="object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="w-full h-full bg-[#09090B] text-white flex items-center justify-center font-bold text-2xl select-none">
                {initial}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#09090B] font-sans">
                {name || "Knotted Learner"}
              </h1>
              <Badge variant="mint" className="text-[10px] uppercase font-bold px-2 py-0.5">
                {user.role || "STUDENT"}
              </Badge>
            </div>
            <p className="text-xs text-[#71717A] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#71717A]" />
              <span>{user.email}</span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white">
            <a href="/dashboard">
              Learner Dashboard
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </a>
          </Button>
        </div>
      </div>

      {/* 2. Real Telemetry Learning Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A]">
            <span>Enrolled</span>
            <BookOpen className="w-4 h-4 text-[#09090B]" />
          </div>
          <p className="text-2xl font-extrabold text-[#09090B] font-mono">{stats.enrollmentsCount}</p>
          <p className="text-[11px] text-[#71717A]">Active Masterclasses</p>
        </div>

        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A]">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#09090B] font-mono">{stats.completedCount}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Finished Tracks</p>
        </div>

        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A]">
            <span>Certificates</span>
            <Award className="w-4 h-4 text-[#09090B]" />
          </div>
          <p className="text-2xl font-extrabold text-[#09090B] font-mono">{stats.certificatesCount}</p>
          <p className="text-[11px] text-[#71717A]">Cryptographic Credentials</p>
        </div>

        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A]">
            <span>Skill Badges</span>
            <Sparkles className="w-4 h-4 text-[#09090B]" />
          </div>
          <p className="text-2xl font-extrabold text-[#09090B] font-mono">{stats.badgesCount}</p>
          <p className="text-[11px] text-[#71717A]">Earned Achievements</p>
        </div>
      </div>

      {/* 3. Personal Information & Avatar Customization */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-xs space-y-6">
          <div className="border-b border-[#F4F4F5] pb-4 space-y-1">
            <h2 className="text-lg font-bold text-[#09090B] font-sans">
              Personal Information
            </h2>
            <p className="text-xs text-[#71717A]">
              Update your display name and choose an avatar for your learner identity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                Full Display Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="bg-[#FAFAFA] rounded-xl h-11"
                required
              />
              <p className="text-[11px] text-[#71717A]">This name will appear on official certificates and cohort live chats.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                Email Address (Permanent)
              </label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="bg-[#F4F4F5] text-[#71717A] cursor-not-allowed rounded-xl h-11"
              />
              <p className="text-[11px] text-[#71717A]">Account identifier verified via authentication service.</p>
            </div>
          </div>

          {/* Avatar Selector Grid */}
          <div className="space-y-3 pt-4 border-t border-[#F4F4F5]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                Choose an Avatar
              </label>
              <span className="text-[11px] font-mono text-[#71717A]">Preset or Custom Cloud Storage</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {AVATAR_PRESETS.map((presetUrl, idx) => {
                const isSelected = selectedImage === presetUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(presetUrl)}
                    className={cn(
                      "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-0.5",
                      isSelected
                        ? "border-[#09090B] ring-2 ring-[#09090B]/20 scale-105"
                        : "border-[#E4E4E7] hover:border-[#A1A1AA]"
                    )}
                  >
                    <Image
                      src={presetUrl}
                      alt={`Avatar Preset ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover rounded-xl"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Avatar Upload Dropzone */}
          <div className="space-y-3 pt-4 border-t border-[#F4F4F5]">
            <label className="block text-xs font-bold text-[#09090B]">
              Or Upload Custom Photo (Cloud Storage)
            </label>
            <FileDropzone
              purpose="user_avatar"
              accept="image/*"
              maxSizeBytes={5 * 1024 * 1024}
              initialUrl={selectedImage?.startsWith("http") && !AVATAR_PRESETS.includes(selectedImage) ? selectedImage : undefined}
              onUploadComplete={(file) => {
                setSelectedImage(file.fileKey);
              }}
              label="Drop profile image here (JPG, PNG, WebP up to 5MB)"
            />
          </div>
        </div>

        {/* Save Bar & Error / Success Messages */}
        <div className="flex items-center justify-between p-6 rounded-2xl bg-white border border-[#E4E4E7] shadow-xs">
          <div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Profile updated successfully!
              </span>
            )}
            {errorMessage && (
              <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {errorMessage}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#09090B] text-white hover:bg-[#27272A] font-bold text-xs sm:text-sm h-11 px-8 rounded-xl shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>

      {/* 4. Danger Zone: Delete Account */}
      <div className="rounded-3xl border border-red-200 bg-red-50/50 p-8 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-red-950 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              Delete Account & Clear Learner Data
            </h3>
            <p className="text-xs text-red-800 leading-relaxed max-w-xl">
              Permanently delete your user account, course enrollments, cohort attendance records, and cryptographic credentials. This action cannot be undone.
            </p>
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-xl text-xs font-bold shadow-xs shrink-0"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 text-[#09090B]">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#09090B]">
                Are you absolutely sure?
              </h3>
              <p className="text-xs text-[#71717A] leading-relaxed">
                This action is irreversible. To confirm deletion, type <strong className="text-red-600 font-mono">DELETE</strong> in the field below.
              </p>
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="font-mono text-center bg-[#FAFAFA] rounded-xl h-11"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="rounded-xl border-[#E4E4E7] text-xs font-bold bg-white"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
                className="rounded-xl text-xs font-bold h-10 px-6 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Deleting...
                  </>
                ) : (
                  "Permanently Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
