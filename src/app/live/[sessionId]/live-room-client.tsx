"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  endLiveSessionAction,
  sendLiveChatMessageAction,
  getLiveSessionStateAction,
  sendLiveSignalAction,
  getLiveSignalsAction,
  leaveLiveSessionAction,
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
  Users,
  PhoneOff,
  Send,
  Monitor,
  AlertCircle,
  Loader2,
  LayoutGrid,
  Maximize2,
  Pin,
  Sparkles,
  Clock,
  MessageSquare,
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  SmilePlus,
  MoreVertical,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// WebRTC Configuration — Enterprise STUN & Open TURN Relays
// ═══════════════════════════════════════════════════════════════

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

// ═══════════════════════════════════════════════════════════════
// Gradient Avatars - Unique per participant
// ═══════════════════════════════════════════════════════════════

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-green-500",
  "from-fuchsia-500 to-pink-600",
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ═══════════════════════════════════════════════════════════════
// Live Timer Hook
// ═══════════════════════════════════════════════════════════════

function useLiveTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const formatted = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return formatted;
}

// ═══════════════════════════════════════════════════════════════
// Emoji Reactions
// ═══════════════════════════════════════════════════════════════

const REACTIONS = [
  { emoji: "👏", label: "Clap" },
  { emoji: "🎉", label: "Celebrate" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💡", label: "Idea" },
];

// ═══════════════════════════════════════════════════════════════
// VideoTile Component — Premium 16:9 Video Cell
// ═══════════════════════════════════════════════════════════════

function VideoTile({
  stream,
  name,
  isLocal,
  isInstructor,
  micOn,
  cameraOn,
  handRaised,
  isSpotlight,
  onPin,
  size = "normal",
  className,
}: {
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isInstructor?: boolean;
  micOn: boolean;
  cameraOn: boolean;
  handRaised?: boolean;
  isSpotlight?: boolean;
  onPin?: () => void;
  size?: "small" | "normal" | "large";
  className?: string;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const gradient = useMemo(() => getAvatarGradient(name), [name]);

  // Audio level analyser for speaking detection
  useEffect(() => {
    if (!stream || !micOn) {
      setIsSpeaking(false);
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        setIsSpeaking(sum / bufferLength > 18);
      }, 200);
      return () => {
        clearInterval(interval);
        audioContext.close().catch(() => {});
      };
    } catch {}
  }, [stream, micOn]);

  const avatarSize = size === "small" ? "w-10 h-10 text-sm" : size === "large" ? "w-20 h-20 text-3xl" : "w-14 h-14 text-xl";

  const [hasActiveVideo, setHasActiveVideo] = useState(false);

  useEffect(() => {
    if (!stream) {
      setHasActiveVideo(false);
      return;
    }
    const checkTracks = () => {
      const vTracks = stream.getVideoTracks();
      setHasActiveVideo(vTracks.length > 0 && vTracks.some((t) => t.enabled));
    };
    checkTracks();
    stream.addEventListener("addtrack", checkTracks);
    stream.addEventListener("removetrack", checkTracks);
    const interval = setInterval(checkTracks, 500);
    return () => {
      stream.removeEventListener("addtrack", checkTracks);
      stream.removeEventListener("removetrack", checkTracks);
      clearInterval(interval);
    };
  }, [stream]);

  const showVideo = isLocal ? (cameraOn && !!stream) : (cameraOn && hasActiveVideo);

  return (
    <div
      className={cn(
        "relative bg-[#1A1A1D] overflow-hidden flex items-center justify-center group transition-all duration-300",
        size === "small" ? "rounded-xl" : "rounded-2xl",
        isSpeaking
          ? "ring-2 ring-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.25)]"
          : "ring-1 ring-white/[0.06]",
        className
      )}
    >
      {/* Video Element */}
      <video
        ref={(el) => {
          if (el) {
            if (el.srcObject !== stream) el.srcObject = stream;
            el.play().catch(() => {
              el.muted = true;
              el.play().catch(() => {});
            });
          }
        }}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "w-full h-full object-cover",
          showVideo ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        )}
      />

      {/* Avatar Fallback */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-lg", gradient, avatarSize)}>
            {name.charAt(0).toUpperCase()}
          </div>
          {size !== "small" && (
            <span className="text-[11px] text-white/40 font-medium">
              {cameraOn ? "Connecting live video..." : "Camera off"}
            </span>
          )}
        </div>
      )}

      {/* Remote Audio Pipeline */}
      {!isLocal && stream && (
        <audio
          ref={(el) => {
            if (el && el.srcObject !== stream) {
              el.srcObject = stream;
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
        />
      )}

      {/* Pin overlay */}
      {onPin && (
        <button
          type="button"
          onClick={onPin}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title={isSpotlight ? "Unpin" : "Pin to spotlight"}
        >
          <Pin className={cn("w-3.5 h-3.5", isSpotlight && "fill-white")} />
        </button>
      )}

      {/* Hand raised */}
      {handRaised && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-400/90 text-black text-[10px] font-bold flex items-center gap-1 shadow-md animate-bounce z-10">
          <Hand className="w-3 h-3" />
          <span className="hidden sm:inline">Raised</span>
        </div>
      )}

      {/* Bottom name bar */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("font-semibold text-white truncate", size === "small" ? "text-[10px]" : "text-xs")}>
            {name}
          </span>
          {isLocal && <span className="text-[9px] text-white/50">(You)</span>}
          {isInstructor && (
            <span className="px-1.5 py-px rounded text-[8px] font-bold uppercase bg-emerald-500/90 text-white tracking-wider">Host</span>
          )}
        </div>
        <div className={cn(
          "p-1 rounded-md shrink-0",
          micOn ? "text-emerald-400" : "bg-red-500/80 text-white"
        )}>
          {micOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Simple Tiptap Notes Editor (lightweight inline version)
// ═══════════════════════════════════════════════════════════════

function NotesEditor({ sessionId }: { sessionId: string }) {
  const storageKey = `knotted-live-notes-${sessionId}`;
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setContent(saved);
  }, [storageKey]);

  const handleChange = (val: string) => {
    setContent(val);
    localStorage.setItem(storageKey, val);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 border-b border-white/[0.06]">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
          My Session Notes
        </h3>
        <p className="text-[10px] text-white/30 mt-0.5">Personal notes — only visible to you</p>
      </div>
      <div className="flex-1 p-3 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Take notes during the session...&#10;&#10;• Key concepts&#10;• Questions to ask&#10;• Action items"
          className="w-full h-full bg-transparent text-[13px] text-white/80 placeholder-white/20 resize-none outline-none leading-relaxed font-mono"
          spellCheck={false}
        />
      </div>
      <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] text-white/20 font-mono">Auto-saved locally</span>
        <span className="text-[10px] text-white/20 font-mono">{content.length} chars</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main LiveRoomClient Component
// ═══════════════════════════════════════════════════════════════

export function LiveRoomClient({
  session,
  attendees: initialAttendees,
  initialMessages,
  user,
  isInstructor,
}: LiveRoomClientProps) {
  const router = useRouter();
  const liveTimer = useLiveTimer();

  // ─── Local Media ───
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // ─── View State ───
  const [viewMode, setViewMode] = useState<"grid" | "spotlight">("spotlight");
  const [spotlightUserId, setSpotlightUserId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<"chat" | "notes" | "info">("chat");
  const [peoplePanelOpen, setPeoplePanelOpen] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");

  const [roomNotification, setRoomNotification] = useState<string | null>(null);
  const [peopleSearch, setPeopleSearch] = useState("");

  // ─── WebRTC Remote State ───
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerStatuses, setPeerStatuses] = useState<
    Map<string, { micOn: boolean; cameraOn: boolean; handRaised: boolean }>
  >(new Map());

  // ─── Database State ───
  const [attendees, setAttendees] = useState<AttendeeItem[]>(initialAttendees);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLiveActive, setIsLiveActive] = useState(session.isLive);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastSignalIdRef = useRef<string | null>(null);

  const triggerNotification = (text: string) => {
    setRoomNotification(text);
    setTimeout(() => setRoomNotification(null), 4000);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Emoji Reaction Broadcast ───
  const sendReaction = (emoji: string) => {
    setShowReactions(false);
    const id = Date.now();
    const x = 20 + Math.random() * 60;
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
    sendLiveSignalAction(session.id, null, "reaction", JSON.stringify({ emoji, name: user.name || user.email })).catch(() => {});
  };

  // ═══════════════════════════════════════════════════════════
  // WebRTC Peer Connection Management (PRESERVED from existing)
  // ═══════════════════════════════════════════════════════════

  const getOrCreatePeerConnection = useCallback(
    (peerId: string) => {
      if (peerConnections.current.has(peerId)) {
        return peerConnections.current.get(peerId)!;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      const stream = screenStreamRef.current || localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          try { pc.addTrack(track, stream); } catch {}
        });
      }

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          const allReceivers = pc.getReceivers();
          const allTracks = allReceivers.map((r) => r.track).filter(Boolean);
          if (allTracks.length > 0) {
            next.set(peerId, new MediaStream(allTracks));
          }
          return next;
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendLiveSignalAction(session.id, peerId, "candidate", JSON.stringify(event.candidate)).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setConnectionStatus("connected");
        } else if (state === "connecting") {
          setConnectionStatus("connecting");
        } else if (state === "failed") {
          pc.close();
          peerConnections.current.delete(peerId);
          if (user.id < peerId) {
            setTimeout(() => sendOffer(peerId), 1500);
          }
        } else if (state === "disconnected" || state === "closed") {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
          peerConnections.current.delete(peerId);
        }
      };

      peerConnections.current.set(peerId, pc);
      return pc;
    },
    [session.id, user.id]
  );

  // Vanilla ICE helper: wait for ICE gathering to finish or up to 1200ms
  const waitForIceGathering = (pc: RTCPeerConnection): Promise<RTCSessionDescription | null> => {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") {
        resolve(pc.localDescription);
        return;
      }
      const timeout = setTimeout(() => {
        resolve(pc.localDescription);
      }, 1200);
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") {
          clearTimeout(timeout);
          resolve(pc.localDescription);
        }
      };
    });
  };

  const sendOffer = useCallback(
    async (peerId: string) => {
      try {
        const pc = getOrCreatePeerConnection(peerId);
        const stream = screenStreamRef.current || localStreamRef.current;
        if (stream) {
          stream.getTracks().forEach((track) => {
            const senders = pc.getSenders();
            if (!senders.some((s) => s.track?.kind === track.kind)) {
              try { pc.addTrack(track, stream); } catch {}
            }
          });
        }
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);

        // Wait for ICE gathering to complete so ALL candidates are embedded in the SDP
        const completeOffer = await waitForIceGathering(pc);
        if (completeOffer) {
          await sendLiveSignalAction(session.id, peerId, "offer", JSON.stringify(completeOffer));
        }
      } catch {}
    },
    [getOrCreatePeerConnection, session.id]
  );

  // ─── Initialize Local Media ───
  const initMedia = useCallback(async () => {
    try {
      setStreamError(null);
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera/Mic not supported.");

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setConnectionStatus("connecting");

      peerConnections.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          if (!senders.some((s) => s.track?.kind === track.kind)) {
            try { pc.addTrack(track, stream); } catch {}
          }
        });
      });

      await sendLiveSignalAction(session.id, null, "join", JSON.stringify({ name: user.name || user.email }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Camera access denied.";
      setStreamError(msg);
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioOnly;
        setLocalStream(audioOnly);
        setCameraOn(false);
        await sendLiveSignalAction(session.id, null, "join", JSON.stringify({ name: user.name || user.email }));
      } catch {}
    }
  }, [session.id, user.name, user.email]);

  const joinSentRef = useRef(false);

  useEffect(() => {
    if (!joinSentRef.current) {
      joinSentRef.current = true;
      initMedia();
    }

    const handleBeforeUnload = () => { leaveLiveSessionAction(session.id); };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      leaveLiveSessionAction(session.id);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
    };
  }, [initMedia, session.id]);

  // ─── WebRTC Signal Polling ───
  useEffect(() => {
    const signalInterval = setInterval(async () => {
      try {
        const { signals } = await getLiveSignalsAction(session.id, lastSignalIdRef.current);
        if (signals && signals.length > 0) {
          lastSignalIdRef.current = signals[signals.length - 1].id;

          // Deduplicate offers per sender
          const lastOfferIdx = new Map<string, number>();
          signals.forEach((sig, idx) => { if (sig.type === "offer") lastOfferIdx.set(sig.senderId, idx); });
          const skipIdx = new Set<number>();
          signals.forEach((sig, idx) => {
            if (sig.type === "offer") {
              const last = lastOfferIdx.get(sig.senderId);
              if (last !== undefined && idx < last) skipIdx.add(idx);
            }
          });

          for (let i = 0; i < signals.length; i++) {
            if (skipIdx.has(i)) continue;
            const sig = signals[i];
            const senderId = sig.senderId;

            if (sig.type === "join") {
              const info = JSON.parse(sig.payload || "{}");
              triggerNotification(`👋 ${info.name || "Someone"} joined`);
              if (user.id < senderId) await sendOffer(senderId);
              sendLiveSignalAction(session.id, senderId, "status", JSON.stringify({ micOn, cameraOn, handRaised })).catch(() => {});
            } else if (sig.type === "leave") {
              const info = JSON.parse(sig.payload || "{}");
              triggerNotification(`${info.name || "Someone"} left`);
              peerConnections.current.get(senderId)?.close();
              peerConnections.current.delete(senderId);
              setRemoteStreams((prev) => { const n = new Map(prev); n.delete(senderId); return n; });
              setAttendees((prev) => prev.filter((a) => a.id !== senderId));
            } else if (sig.type === "offer") {
              const existingPc = peerConnections.current.get(senderId);
              const existingState = existingPc?.connectionState;
              if (existingPc && (existingState === "connected" || existingState === "connecting")) continue;
              if (existingPc && existingState !== "new") {
                existingPc.close();
                peerConnections.current.delete(senderId);
              }
              try {
                const pc = getOrCreatePeerConnection(senderId);
                const offerData = JSON.parse(sig.payload);
                const stream = screenStreamRef.current || localStreamRef.current;
                if (stream) {
                  stream.getTracks().forEach((track) => {
                    const senders = pc.getSenders();
                    if (!senders.some((s) => s.track?.kind === track.kind)) {
                      try { pc.addTrack(track, stream); } catch {}
                    }
                  });
                }
                await pc.setRemoteDescription(new RTCSessionDescription(offerData));
                const queued = iceCandidateQueue.current.get(senderId) || [];
                for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                iceCandidateQueue.current.delete(senderId);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                const completeAnswer = await waitForIceGathering(pc);
                if (completeAnswer) {
                  await sendLiveSignalAction(session.id, senderId, "answer", JSON.stringify(completeAnswer));
                }
              } catch {}
            } else if (sig.type === "answer") {
              try {
                const pc = getOrCreatePeerConnection(senderId);
                const answerData = JSON.parse(sig.payload);
                if (pc.signalingState === "have-local-offer") {
                  await pc.setRemoteDescription(new RTCSessionDescription(answerData));
                  const queued = iceCandidateQueue.current.get(senderId) || [];
                  for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                  iceCandidateQueue.current.delete(senderId);
                }
              } catch {}
            } else if (sig.type === "candidate") {
              const pc = getOrCreatePeerConnection(senderId);
              const candidateData = JSON.parse(sig.payload);
              if (pc.remoteDescription?.type) {
                await pc.addIceCandidate(new RTCIceCandidate(candidateData)).catch(() => {});
              } else {
                const q = iceCandidateQueue.current.get(senderId) || [];
                q.push(candidateData);
                iceCandidateQueue.current.set(senderId, q);
              }
            } else if (sig.type === "status") {
              setPeerStatuses((prev) => new Map(prev).set(senderId, JSON.parse(sig.payload)));
            } else if (sig.type === "reaction") {
              const data = JSON.parse(sig.payload);
              const id = Date.now() + Math.random();
              const x = 20 + Math.random() * 60;
              setFloatingReactions((prev) => [...prev, { id, emoji: data.emoji, x }]);
              setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 2500);
            }
          }
        }
      } catch {}
    }, 1000);
    return () => clearInterval(signalInterval);
  }, [session.id, sendOffer, getOrCreatePeerConnection, micOn, cameraOn, handRaised, user.id]);

  // ─── Database Polling ───
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const state = await getLiveSessionStateAction(session.id);
        setIsLiveActive(state.isLive);
        if (state.attendees.length > 0) setAttendees(state.attendees);
        if (state.messages.length > 0) setMessages(state.messages);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [session.id]);

  // ═══════════════════════════════════════════════════════════
  // Controls
  // ═══════════════════════════════════════════════════════════

  function toggleMicrophone() {
    const stream = localStreamRef.current;
    if (stream) {
      const next = !micOn;
      stream.getAudioTracks().forEach((t) => (t.enabled = next));
      setMicOn(next);
      sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn: next, cameraOn, handRaised })).catch(() => {});
    }
  }

  function toggleCamera() {
    const stream = localStreamRef.current;
    if (stream) {
      const next = !cameraOn;
      stream.getVideoTracks().forEach((t) => (t.enabled = next));
      setCameraOn(next);
      sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn, cameraOn: next, handRaised })).catch(() => {});
    }
  }

  async function toggleScreenShare() {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (localStreamRef.current) {
        peerConnections.current.forEach((pc) => {
          const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
          const localTrack = localStreamRef.current?.getVideoTracks()[0];
          if (videoSender && localTrack) videoSender.replaceTrack(localTrack);
        });
      }
      setLocalStream(localStreamRef.current);
      setIsScreenSharing(false);
    } else {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) return alert("Screen sharing not supported.");
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" }, audio: true });
        screenStreamRef.current = screenStream;
        setLocalStream(screenStream);
        const screenTrack = screenStream.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (videoSender && screenTrack) videoSender.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch {}
    }
  }

  function toggleHandRaise() {
    const next = !handRaised;
    setHandRaised(next);
    sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn, cameraOn, handRaised: next })).catch(() => {});
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;
    const text = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);
    try {
      const res = await sendLiveChatMessageAction(session.id, text);
      if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
    } catch {} finally { setIsSending(false); }
  }

  async function handleLeaveRoom() {
    if (isInstructor) {
      if (confirm("End this live session for all participants?")) {
        await endLiveSessionAction(session.id);
        router.push("/creator/live");
      }
    } else {
      await leaveLiveSessionAction(session.id);
      router.push("/live");
    }
  }

  function copyMeetingLink() {
    const url = `${window.location.origin}/live/${session.id}`;
    navigator.clipboard?.writeText(url);
    triggerNotification("📋 Meeting link copied!");
  }

  // ═══════════════════════════════════════════════════════════
  // Derived State
  // ═══════════════════════════════════════════════════════════

  const otherAttendees = attendees.filter((a) => a.id !== user.id);
  const totalParticipants = 1 + otherAttendees.length;
  const filteredPeople = peopleSearch
    ? otherAttendees.filter((a) => a.name.toLowerCase().includes(peopleSearch.toLowerCase()) || a.email.toLowerCase().includes(peopleSearch.toLowerCase()))
    : otherAttendees;
  const spotlightAttendee = otherAttendees.find((a) => a.id === spotlightUserId);
  const isLocalSpotlight = !spotlightUserId || spotlightUserId === user.id;

  // ═══════════════════════════════════════════════════════════
  // RENDER — Teams-Style 3-Column Layout
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="h-screen flex flex-col bg-[#111113] text-white overflow-hidden font-sans">
      {/* ─── Floating Emoji Reactions ─── */}
      {floatingReactions.map((r) => (
        <div
          key={r.id}
          className="fixed z-[100] text-4xl pointer-events-none animate-[float-up_2.5s_ease-out_forwards]"
          style={{ left: `${r.x}%`, bottom: "120px" }}
        >
          {r.emoji}
        </div>
      ))}

      {/* ─── Toast Notification ─── */}
      {roomNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-xl bg-[#1E1E21]/95 border border-white/10 text-white text-xs font-semibold backdrop-blur-xl shadow-2xl flex items-center gap-2 animate-[slide-down_0.3s_ease-out]">
          <span>{roomNotification}</span>
        </div>
      )}

      {/* ═══════ HEADER BAR ═══════ */}
      <header className="h-14 bg-[#1A1A1D] border-b border-white/[0.06] px-4 flex items-center justify-between shrink-0 z-40">
        {/* Left: Session Info */}
        <div className="flex items-center gap-3 min-w-0">
          <Logo size="sm" />
          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "w-2 h-2 rounded-full shrink-0",
              isLiveActive ? "bg-red-500 animate-pulse" : "bg-zinc-500"
            )} />
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider shrink-0">
              {isLiveActive ? "LIVE" : "OFFLINE"}
            </span>
            <span className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[400px]">
              {session.title}
            </span>
          </div>
        </div>

        {/* Center: Timer & Connection */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.06] text-xs font-mono text-white/70">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span>{liveTimer}</span>
          </div>

          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border",
            connectionStatus === "connected"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : connectionStatus === "connecting"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            {connectionStatus === "connected" ? <Wifi className="w-3 h-3" /> : connectionStatus === "connecting" ? <Loader2 className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Right: Participant Count & Leave */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPeoplePanelOpen(!peoplePanelOpen)}
            className={cn(
              "hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              peoplePanelOpen ? "bg-white/10 text-white" : "bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{totalParticipants}</span>
          </button>

          <button
            type="button"
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isInstructor ? "End" : "Leave"}</span>
          </button>
        </div>
      </header>

      {/* ═══════ MAIN BODY — 3-Column Layout ═══════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ─── LEFT: People Panel (collapsible) ─── */}
        {peoplePanelOpen && (
          <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-[#151517] border-r border-white/[0.06] shrink-0">
            {/* People header */}
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-bold text-white/70">People ({totalParticipants})</span>
              <button type="button" onClick={() => setPeoplePanelOpen(false)} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  placeholder="Search people..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/[0.05] border border-white/[0.06] text-xs text-white placeholder-white/30 outline-none focus:border-white/15"
                />
              </div>
            </div>

            {/* People list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {/* Self */}
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/[0.04]">
                <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[11px] font-bold text-white shrink-0", getAvatarGradient(user.name || user.email))}>
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-white truncate">{user.name || user.email}</span>
                    <span className="text-[9px] text-white/30">(You)</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-semibold uppercase">{isInstructor ? "Host" : "Student"}</span>
                </div>
                <div className="flex items-center gap-1">
                  {micOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                  {cameraOn ? <Video className="w-3 h-3 text-emerald-400" /> : <VideoOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>

              {/* Other participants */}
              {filteredPeople.map((att) => {
                const ps = peerStatuses.get(att.id);
                return (
                  <div key={att.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => { setSpotlightUserId(att.id); setViewMode("spotlight"); }}>
                    <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[11px] font-bold text-white shrink-0 relative", getAvatarGradient(att.name))}>
                      {att.name.charAt(0).toUpperCase()}
                      {ps?.handRaised && <span className="absolute -top-0.5 -right-0.5 text-[10px] animate-bounce">✋</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-white/80 truncate block">{att.name}</span>
                      <span className="text-[9px] text-white/30 uppercase font-semibold">{att.role || "Student"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(ps?.micOn ?? true) ? <Mic className="w-3 h-3 text-emerald-400/60" /> : <MicOff className="w-3 h-3 text-red-400/60" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* ─── CENTER: Video Stage ─── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#111113] relative">
          <DRMShield userEmail={user.email} userId={user.id} />

          {streamError && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{streamError}</span>
            </div>
          )}

          {/* Video Area */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col min-h-0">
            {viewMode === "spotlight" ? (
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                {/* Main Spotlight */}
                <div className="flex-1 min-h-0">
                  {isLocalSpotlight ? (
                    <VideoTile
                      stream={localStream}
                      name={user.name || user.email}
                      isLocal={true}
                      isInstructor={isInstructor}
                      micOn={micOn}
                      cameraOn={cameraOn || isScreenSharing}
                      handRaised={handRaised}
                      isSpotlight={true}
                      size="large"
                      className="w-full h-full"
                    />
                  ) : spotlightAttendee ? (
                    <VideoTile
                      stream={remoteStreams.get(spotlightAttendee.id) || null}
                      name={spotlightAttendee.name}
                      isLocal={false}
                      isInstructor={spotlightAttendee.role === "INSTRUCTOR"}
                      micOn={peerStatuses.get(spotlightAttendee.id)?.micOn ?? true}
                      cameraOn={peerStatuses.get(spotlightAttendee.id)?.cameraOn ?? true}
                      handRaised={peerStatuses.get(spotlightAttendee.id)?.handRaised ?? false}
                      isSpotlight={true}
                      onPin={() => setSpotlightUserId(null)}
                      size="large"
                      className="w-full h-full"
                    />
                  ) : null}
                </div>

                {/* Filmstrip */}
                {totalParticipants > 1 && (
                  <div className="h-[100px] flex items-center gap-2 overflow-x-auto shrink-0 pb-1">
                    {!isLocalSpotlight && (
                      <div className="w-[140px] h-full shrink-0">
                        <VideoTile stream={localStream} name={user.name || user.email} isLocal={true} isInstructor={isInstructor} micOn={micOn} cameraOn={cameraOn || isScreenSharing} handRaised={handRaised} onPin={() => setSpotlightUserId(user.id)} size="small" className="w-full h-full cursor-pointer hover:ring-emerald-400" />
                      </div>
                    )}
                    {otherAttendees.map((att) => {
                      if (att.id === spotlightUserId) return null;
                      const ps = peerStatuses.get(att.id);
                      return (
                        <div key={att.id} className="w-[140px] h-full shrink-0">
                          <VideoTile stream={remoteStreams.get(att.id) || null} name={att.name} isLocal={false} isInstructor={att.role === "INSTRUCTOR"} micOn={ps?.micOn ?? true} cameraOn={ps?.cameraOn ?? true} handRaised={ps?.handRaised ?? false} onPin={() => setSpotlightUserId(att.id)} size="small" className="w-full h-full cursor-pointer hover:ring-emerald-400" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Gallery Grid */
              <div className={cn(
                "flex-1 grid gap-3 auto-rows-fr",
                totalParticipants === 1 && "grid-cols-1",
                totalParticipants === 2 && "grid-cols-1 sm:grid-cols-2",
                totalParticipants >= 3 && totalParticipants <= 4 && "grid-cols-2",
                totalParticipants >= 5 && totalParticipants <= 6 && "grid-cols-2 md:grid-cols-3",
                totalParticipants > 6 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              )}>
                <VideoTile stream={localStream} name={user.name || user.email} isLocal={true} isInstructor={isInstructor} micOn={micOn} cameraOn={cameraOn || isScreenSharing} handRaised={handRaised} onPin={() => { setSpotlightUserId(user.id); setViewMode("spotlight"); }} className="w-full h-full" />
                {otherAttendees.map((att) => {
                  const ps = peerStatuses.get(att.id);
                  return (
                    <VideoTile key={att.id} stream={remoteStreams.get(att.id) || null} name={att.name} isLocal={false} isInstructor={att.role === "INSTRUCTOR"} micOn={ps?.micOn ?? true} cameraOn={ps?.cameraOn ?? true} handRaised={ps?.handRaised ?? false} onPin={() => { setSpotlightUserId(att.id); setViewMode("spotlight"); }} className="w-full h-full" />
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Floating Control Bar ─── */}
          <div className="pb-4 px-4 flex justify-center shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 p-2 rounded-2xl bg-[#1E1E21]/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl">
              {/* Mic */}
              <button type="button" onClick={toggleMicrophone} className={cn("p-2.5 sm:p-3 rounded-xl transition-all", micOn ? "bg-white/[0.08] text-white hover:bg-white/15" : "bg-red-600 text-white")} title={micOn ? "Mute" : "Unmute"}>
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              {/* Camera */}
              <button type="button" onClick={toggleCamera} className={cn("p-2.5 sm:p-3 rounded-xl transition-all", cameraOn ? "bg-white/[0.08] text-white hover:bg-white/15" : "bg-red-600 text-white")} title={cameraOn ? "Camera Off" : "Camera On"}>
                {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              {/* Screen Share */}
              <button type="button" onClick={toggleScreenShare} className={cn("p-2.5 sm:p-3 rounded-xl transition-all", isScreenSharing ? "bg-emerald-500 text-black" : "bg-white/[0.08] text-white hover:bg-white/15")} title="Screen Share">
                <Monitor className="w-5 h-5" />
              </button>
              {/* Hand */}
              <button type="button" onClick={toggleHandRaise} className={cn("p-2.5 sm:p-3 rounded-xl transition-all", handRaised ? "bg-amber-400 text-black" : "bg-white/[0.08] text-white hover:bg-white/15")} title="Raise Hand">
                <Hand className="w-5 h-5" />
              </button>

              <div className="w-px h-7 bg-white/10 mx-0.5" />

              {/* Reactions */}
              <div className="relative">
                <button type="button" onClick={() => setShowReactions(!showReactions)} className="p-2.5 sm:p-3 rounded-xl bg-white/[0.08] text-white hover:bg-white/15 transition-all" title="Reactions">
                  <SmilePlus className="w-5 h-5" />
                </button>
                {showReactions && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 p-2 rounded-xl bg-[#1E1E21] border border-white/10 shadow-2xl">
                    {REACTIONS.map((r) => (
                      <button key={r.emoji} type="button" onClick={() => sendReaction(r.emoji)} className="text-xl hover:scale-125 transition-transform p-1" title={r.label}>
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <button type="button" onClick={() => setViewMode(viewMode === "spotlight" ? "grid" : "spotlight")} className="p-2.5 sm:p-3 rounded-xl bg-white/[0.08] text-white hover:bg-white/15 transition-all" title={viewMode === "spotlight" ? "Gallery" : "Speaker"}>
                {viewMode === "spotlight" ? <LayoutGrid className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              <div className="w-px h-7 bg-white/10 mx-0.5" />

              {/* Leave - Mobile only shows icon */}
              <button type="button" onClick={handleLeaveRoom} className="p-2.5 sm:p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all lg:hidden">
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* ─── RIGHT: Side Panel (Chat / Notes / Info) ─── */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-[340px] bg-[#151517] border-l border-white/[0.06] shrink-0">
          {/* Tab Bar */}
          <div className="p-2 border-b border-white/[0.06] flex items-center gap-1">
            {[
              { key: "chat" as const, icon: MessageSquare, label: "Chat" },
              { key: "notes" as const, icon: FileText, label: "Notes" },
              { key: "info" as const, icon: Info, label: "Info" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSideTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-colors",
                  activeSideTab === tab.key
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ─── Chat Tab ─── */}
          {activeSideTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {messages.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 mx-auto text-white/10 mb-2" />
                    <p className="text-[11px] text-white/30">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="group">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={cn("w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center text-[8px] font-bold text-white shrink-0", getAvatarGradient(m.sender))}>
                          {m.sender.charAt(0).toUpperCase()}
                        </div>
                        <span className={cn("text-[11px] font-semibold", m.role === "INSTRUCTOR" ? "text-emerald-400" : "text-white/80")}>
                          {m.sender}
                          {m.role === "INSTRUCTOR" && <span className="ml-1 text-[8px] px-1 py-px rounded bg-emerald-500/20 text-emerald-400 uppercase font-bold">Host</span>}
                        </span>
                        <span className="text-[9px] text-white/20 ml-auto">{m.time}</span>
                      </div>
                      <div className="ml-7 px-3 py-2 rounded-xl bg-white/[0.04] text-xs text-white/70 leading-relaxed">
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.06] flex items-center gap-2">
                <input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-9 px-3 rounded-lg bg-white/[0.05] border border-white/[0.06] text-xs text-white placeholder-white/30 outline-none focus:border-white/15"
                />
                <button type="submit" disabled={isSending} className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-50">
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {/* ─── Notes Tab ─── */}
          {activeSideTab === "notes" && (
            <div className="flex-1 min-h-0">
              <NotesEditor sessionId={session.id} />
            </div>
          )}

          {/* ─── Info Tab ─── */}
          {activeSideTab === "info" && (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">{session.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{session.description || "Live interactive session."}</p>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="font-medium">Course: {session.course.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Clock className="w-3.5 h-3.5 text-white/30" />
                  <span>Duration: {session.durationMin} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Users className="w-3.5 h-3.5 text-white/30" />
                  <span>{totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button type="button" onClick={copyMeetingLink} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.06] text-xs font-semibold text-white/70 transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Meeting Link</span>
                </button>

                <Link href={`/courses/${session.course.slug}`} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-xs font-semibold text-violet-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Course Page</span>
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── CSS Animations ─── */}
      <style jsx global>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-200px) scale(1.5); }
        }
        @keyframes slide-down {
          0% { opacity: 0; transform: translate(-50%, -10px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
