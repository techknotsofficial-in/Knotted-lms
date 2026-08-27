"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  endLiveSessionAction,
  sendLiveChatMessageAction,
  getLiveSessionStateAction,
} from "@/actions/live";
import { DRMShield } from "@/components/player/drm-shield";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Hand,
  MessageSquare,
  Users,
  Radio,
  PhoneOff,
  Send,
  Sparkles,
  Monitor,
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendeeItem {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  joinedAt: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: "INSTRUCTOR" | "STUDENT";
  text: string;
  time: string;
}

interface LiveRoomClientProps {
  session: {
    id: string;
    title: string;
    description: string | null;
    roomToken: string;
    isLive: boolean;
    durationMin: number;
    course: {
      title: string;
      slug: string;
    };
  };
  attendees: AttendeeItem[];
  initialMessages: ChatMessage[];
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  isInstructor: boolean;
}

export function LiveRoomClient({
  session,
  attendees: initialAttendees,
  initialMessages,
  user,
  isInstructor,
}: LiveRoomClientProps) {
  const router = useRouter();

  // Media Stream & Device State
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<"chat" | "attendees">("chat");

  // Real Database Attendees & Live Messages State
  const [attendees, setAttendees] = useState<AttendeeItem[]>(initialAttendees);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLiveActive, setIsLiveActive] = useState(session.isLive);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-Time 3-Second Synchronizer for Chat, Attendees & Stream Status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const state = await getLiveSessionStateAction(session.id);
        setIsLiveActive(state.isLive);
        if (state.attendees.length > 0) {
          setAttendees(state.attendees);
        }
        if (state.messages.length > 0) {
          setMessages(state.messages);
        }
      } catch (err) {
        // Silent sync catch
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [session.id]);

  // Start Real Hardware Media Stream (Webcam & Microphone)
  const initUserMedia = useCallback(async () => {
    try {
      setStreamError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera & Microphone access is not supported by your browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStreamActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not access camera/microphone";
      setStreamError(msg);
      setStreamActive(false);
    }
  }, []);

  useEffect(() => {
    initUserMedia();

    return () => {
      // Clean up hardware streams on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initUserMedia]);

  // Toggle Microphone Audio Track
  function toggleMicrophone() {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !micOn;
        audioTracks.forEach((track) => {
          track.enabled = nextState;
        });
        setMicOn(nextState);
        return;
      }
    }
    setMicOn(!micOn);
  }

  // Toggle Webcam Video Track
  function toggleCamera() {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !cameraOn;
        videoTracks.forEach((track) => {
          track.enabled = nextState;
        });
        setCameraOn(nextState);
        return;
      }
    }
    setCameraOn(!cameraOn);
  }

  // Start Real Browser Screen Sharing via getDisplayMedia
  async function toggleScreenShare() {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      if (videoRef.current && mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        await videoRef.current.play().catch(() => {});
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert("Screen sharing is not supported in this browser.");
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" },
          audio: true,
        });

        screenStreamRef.current = screenStream;

        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
          await videoRef.current.play().catch(() => {});
        }

        screenStream.getVideoTracks()[0].onended = () => {
          if (videoRef.current && mediaStreamRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
          }
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen sharing cancelled or denied:", err);
      }
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const textToSend = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    try {
      const res = await sendLiveChatMessageAction(session.id, textToSend);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  }

  async function handleLeaveRoom() {
    if (isInstructor) {
      if (confirm("End this live cohort stream for all attendees?")) {
        await endLiveSessionAction(session.id);
        router.push("/creator/live");
      }
    } else {
      router.push(`/live`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-white select-none">
      {/* Top Live Stage Header */}
      <header className="h-16 border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur-md px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <div className="h-4 w-px bg-white/20" />
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("w-2.5 h-2.5 rounded-full", isLiveActive ? "bg-red-500 animate-pulse" : "bg-zinc-500")} />
              <span className={cn("text-[11px] font-bold font-mono tracking-wider uppercase", isLiveActive ? "text-red-400" : "text-zinc-400")}>
                {isLiveActive ? (isInstructor ? "Broadcasting Live" : "Live Cohort Classroom") : "Stream Offline"}
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
              {session.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#A1A1AA] border border-white/10 font-mono">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{Math.max(attendees.length, 1)} Connected</span>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl h-9 px-4"
          >
            <PhoneOff className="w-3.5 h-3.5 mr-1" />
            {isInstructor ? "End Stream" : "Leave Classroom"}
          </Button>
        </div>
      </header>

      {/* Main Classroom Grid: Real Video Stage (9 Cols) + Live Chat Panel (3 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* Left 8/9 Columns: Real Media Stream Video Stage */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between p-4 sm:p-6 relative bg-black/80">
          {/* Subtle Anti-Piracy Watermark */}
          <DRMShield userEmail={user.email} userId={user.id} />

          {/* Center Stage Video Element */}
          <div className="flex-1 rounded-3xl bg-[#09090B] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl min-h-[420px]">
            {/* Real HTML5 Media Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-contain transition-opacity duration-300",
                cameraOn || isScreenSharing ? "opacity-100" : "opacity-0 absolute"
              )}
            />

            {/* Fallback Display if Camera is Off and Not Screen Sharing */}
            {!cameraOn && !isScreenSharing && (
              <div className="text-center space-y-4 p-8">
                <div className="w-24 h-24 mx-auto rounded-full bg-[#18181B] border-2 border-white/20 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">{session.title}</h3>
                  <p className="text-xs text-[#71717A]">Camera is muted. Microphone is {micOn ? "active" : "muted"}.</p>
                </div>
              </div>
            )}

            {/* Browser Permission Info Notification */}
            {streamError && (
              <div className="absolute top-4 left-4 right-4 max-w-md mx-auto p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Camera/Mic note: {streamError} (Grant browser permissions to broadcast your video).</span>
              </div>
            )}

            {/* Hand Raised Banner */}
            {handRaised && (
              <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-xl animate-bounce">
                <Hand className="w-3.5 h-3.5" />
                <span>Hand Raised</span>
              </div>
            )}

            {/* Active Screen Sharing Indicator */}
            {isScreenSharing && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-xl">
                <Monitor className="w-3.5 h-3.5" />
                <span>Broadcasting Screen</span>
              </div>
            )}
          </div>

          {/* Bottom Stage Control Bar */}
          <div className="mt-4 flex items-center justify-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-fit mx-auto">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={toggleMicrophone}
              className={cn(
                "p-3 rounded-xl transition-all",
                micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white shadow-md"
              )}
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              type="button"
              onClick={toggleCamera}
              className={cn(
                "p-3 rounded-xl transition-all",
                cameraOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white shadow-md"
              )}
              title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Real Screen Share Toggle */}
            <button
              type="button"
              onClick={toggleScreenShare}
              className={cn(
                "p-3 rounded-xl transition-all",
                isScreenSharing
                  ? "bg-emerald-500 text-black font-bold shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Window or Display"}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* Raise Hand Toggle */}
            <button
              type="button"
              onClick={() => setHandRaised(!handRaised)}
              className={cn(
                "p-3 rounded-xl transition-all",
                handRaised ? "bg-amber-400 text-black font-bold shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
              )}
              title="Raise Hand to Ask Question"
            >
              <Hand className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right 3/4 Columns: Live Chat & Real Database Attendees Panel */}
        <div className="lg:col-span-4 xl:col-span-3 border-l border-[#27272A] bg-[#09090B] flex flex-col justify-between h-[calc(100vh-64px)]">
          {/* Panel Tabs */}
          <div className="p-3 border-b border-[#27272A] flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSideTab("chat")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors",
                activeSideTab === "chat" ? "bg-white text-black" : "text-[#71717A] hover:text-white"
              )}
            >
              Live Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveSideTab("attendees")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors",
                activeSideTab === "attendees" ? "bg-white text-black" : "text-[#71717A] hover:text-white"
              )}
            >
              Attendees ({Math.max(attendees.length, 1)})
            </button>
          </div>

          {/* Tab 1: Real Persistent Live Chat Stream */}
          {activeSideTab === "chat" && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
                {messages.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#71717A]">
                    No messages yet. Send a question to begin!
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#71717A]">
                        <span
                          className={cn(
                            "font-bold",
                            m.role === "INSTRUCTOR" ? "text-emerald-400" : "text-white"
                          )}
                        >
                          {m.sender} {m.role === "INSTRUCTOR" && "★"}
                        </span>
                        <span>{m.time}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-[#E4E4E7] leading-relaxed">
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[#27272A] flex items-center gap-2 bg-[#18181B]">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message or question..."
                  className="h-10 text-xs bg-white/5 border-white/10 text-white rounded-xl focus:bg-black"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSending}
                  className="bg-white text-black hover:bg-[#F4F4F5] h-10 px-3 rounded-xl"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </>
          )}

          {/* Tab 2: Real Database Attendees List */}
          {activeSideTab === "attendees" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {/* Current User */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px]">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-white">{user.name || user.email} (You)</span>
                </div>
                <Badge variant="mint" className="text-[9px] uppercase font-bold">
                  {isInstructor ? "Host" : "Participant"}
                </Badge>
              </div>

              {/* Other Real Database Attendees */}
              {attendees
                .filter((a) => a.id !== user.id)
                .map((attendee) => (
                  <div
                    key={attendee.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#27272A] text-white flex items-center justify-center font-bold text-[10px]">
                        {attendee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[#E4E4E7] font-medium block">{attendee.name}</span>
                        <span className="text-[10px] text-[#71717A] block">{attendee.email}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase text-[#A1A1AA] border-white/10">
                      {attendee.role || "Student"}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
