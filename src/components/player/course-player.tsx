"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { DRMShield } from "./drm-shield";
import { updateLessonProgressAction } from "@/actions/progress";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Video,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CoursePlayerProps {
  lessonId: string;
  courseId: string;
  videoUrl?: string | null;
  lessonTitle?: string;
  userEmail: string;
  userId: string;
  initialProgressSec?: number;
  isCompleted?: boolean;
  onLessonCompleted?: () => void;
}

export function CoursePlayer({
  lessonId,
  courseId,
  videoUrl,
  lessonTitle = "Lesson Content",
  userEmail,
  userId,
  initialProgressSec = 0,
  isCompleted = false,
  onLessonCompleted,
}: CoursePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [completed, setCompleted] = useState(isCompleted);
  const [hasVideoError, setHasVideoError] = useState(false);

  // Restore initial playback position once when mounting or switching lessons
  const initialRestoredRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialRestoredRef.current !== lessonId) {
      initialRestoredRef.current = lessonId;
      if (videoRef.current && initialProgressSec > 0) {
        videoRef.current.currentTime = initialProgressSec;
        setCurrentTime(initialProgressSec);
      }
      setHasVideoError(false);
    }
  }, [lessonId, initialProgressSec]);

  // Sync Progress Heartbeat (dispatches every 10s of active playback)
  const syncProgress = useCallback(
    async (force = false) => {
      if (!videoRef.current) return;
      const current = videoRef.current.currentTime || 0;
      const total = videoRef.current.duration || 1;

      try {
        const res = await updateLessonProgressAction({
          lessonId,
          courseId,
          watchedSec: current,
          totalDurationSec: total,
          forceComplete: force,
        });

        if (res.isCompleted && !completed) {
          setCompleted(true);
          onLessonCompleted?.();
        }
      } catch (err) {
        console.error("Progress heartbeat error:", err);
      }
    },
    [lessonId, courseId, completed, onLessonCompleted]
  );

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      syncProgress();
    }, 10000); // 10 seconds interval

    return () => clearInterval(interval);
  }, [isPlaying, syncProgress]);

  // Handle Play/Pause with async safety
  async function togglePlay() {
    if (!videoRef.current || !videoUrl) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.log("Playback attempt caught gracefully:", err);
        setIsPlaying(false);
      }
    }
  }

  // Handle Time Update
  function handleTimeUpdate() {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  }

  // Handle Duration Loaded
  function handleLoadedMetadata() {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  }

  // Seek
  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!videoRef.current) return;
    const newTime = Number(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  // Skip 10 seconds
  function skipTime(seconds: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, videoRef.current.currentTime + seconds)
    );
  }

  // Speed Change
  function handleSpeedChange(speed: number) {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackRate(speed);
  }

  // Volume
  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!videoRef.current) return;
    const val = Number(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  }

  // Toggle Mute
  function toggleMute() {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  }

  // Fullscreen
  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }

  // Format Time Helper
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // If no video URL is attached to the lesson, render reading / curriculum placeholder
  if (!videoUrl || hasVideoError) {
    return (
      <div
        ref={containerRef}
        className="relative rounded-3xl overflow-hidden bg-[#09090B] border border-[#27272A] aspect-video flex flex-col items-center justify-center p-8 text-center text-white shadow-2xl space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-xl font-bold font-sans text-white">{lessonTitle}</h3>
          <p className="text-xs text-[#A1A1AA]">
            Interactive curriculum reading & documentation module. Read the lesson notes below or upload media in Creator Studio.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncProgress(true)}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs font-bold rounded-xl mt-2"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
          Mark Lesson Complete
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      onMouseMove={() => setShowControls(true)}
      className="relative rounded-3xl overflow-hidden bg-black aspect-video flex items-center justify-center group select-none shadow-2xl"
    >
      {/* HTML5 Video Layer */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain pointer-events-auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => setHasVideoError(true)}
        onEnded={() => {
          setIsPlaying(false);
          syncProgress(true);
        }}
        onClick={togglePlay}
        playsInline
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Subtle, Professional Learner Security Watermark */}
      <DRMShield userEmail={userEmail} userId={userId} />

      {/* Big Center Play Button Overlay */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute z-40 w-20 h-20 rounded-full bg-[#09090B]/90 text-white flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-2xl border-2 border-white/20 backdrop-blur-md"
        >
          <Play className="w-8 h-8 ml-1 text-white" fill="white" />
        </button>
      )}

      {/* Modern Black & White Player Controls Bar */}
      <div
        className={cn(
          "absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 space-y-3 transition-opacity duration-300 z-40",
          showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {/* Progress Scrubber */}
        <div className="relative flex items-center group/scrubber">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:h-2.5 transition-all"
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-white text-xs font-semibold">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 hover:text-[#A1A1AA] transition-colors focus:outline-none"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip 10s Back / Forward */}
            <button
              type="button"
              onClick={() => skipTime(-10)}
              className="p-1 hover:text-[#A1A1AA] transition-colors focus:outline-none"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => skipTime(10)}
              className="p-1 hover:text-[#A1A1AA] transition-colors focus:outline-none"
              title="Forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Time Stamp */}
            <span className="font-mono text-[11px] text-[#A1A1AA]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 ml-2 group/volume">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 hover:text-[#A1A1AA] transition-colors focus:outline-none"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hidden group-hover/volume:inline-block"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed Multiplier */}
            <select
              value={playbackRate}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              aria-label="Playback speed"
              className="bg-black/60 border border-white/20 rounded-lg text-[11px] font-mono px-2 py-0.5 text-white focus:outline-none"
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>

            {/* Manual Mark Done */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => syncProgress(true)}
              className="h-8 text-xs font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              {completed ? "Completed" : "Mark Done"}
            </Button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 hover:text-[#A1A1AA] transition-colors focus:outline-none"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
