"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
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
import {
  Video, VideoOff, Mic, MicOff, Hand, Users, PhoneOff, Send, Monitor,
  AlertCircle, Loader2, LayoutGrid, Maximize2, Pin, Sparkles, Clock,
  MessageSquare, FileText, Info, ChevronLeft, SmilePlus, Copy,
  ExternalLink, Wifi, WifiOff, Search, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendeeItem {
  id: string; name: string; email: string; image?: string | null;
  role?: string | null; joinedAt: string;
}
interface ChatMessage {
  id: string; sender: string; role: "INSTRUCTOR" | "STUDENT"; text: string; time: string;
}
interface LiveRoomClientProps {
  session: {
    id: string; title: string; description: string | null; roomToken: string;
    isLive: boolean; durationMin: number; course: { title: string; slug: string };
  };
  attendees: AttendeeItem[];
  initialMessages: ChatMessage[];
  user: { id: string; email: string; name?: string | null };
  isInstructor: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: ["turn:openrelay.metered.ca:80","turn:openrelay.metered.ca:443","turn:openrelay.metered.ca:443?transport=tcp"],
      username: "openrelayproject", credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

// Module-scoped (stable, not re-created on each render)
function waitForIceGathering(pc: RTCPeerConnection): Promise<RTCSessionDescription | null> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") { resolve(pc.localDescription); return; }
    const timeout = setTimeout(() => resolve(pc.localDescription), 2000);
    const handler = () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timeout); pc.removeEventListener("icegatheringstatechange", handler);
        resolve(pc.localDescription);
      }
    };
    pc.addEventListener("icegatheringstatechange", handler);
  });
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600","from-blue-500 to-cyan-500","from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500","from-amber-500 to-orange-500","from-indigo-500 to-blue-600",
  "from-teal-500 to-green-500","from-fuchsia-500 to-pink-600",
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function useLiveTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    startRef.current = Date.now();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);
  const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

const REACTIONS = [
  {emoji:"👏",label:"Clap"},{emoji:"🎉",label:"Celebrate"},{emoji:"❤️",label:"Love"},
  {emoji:"😂",label:"Laugh"},{emoji:"🔥",label:"Fire"},{emoji:"💡",label:"Idea"},
];

function VideoTile({
  stream, name, isLocal, isInstructor, micOn, cameraOn, handRaised,
  isSpotlight, onPin, size = "normal", className,
}: {
  stream: MediaStream | null; name: string; isLocal?: boolean; isInstructor?: boolean;
  micOn: boolean; cameraOn: boolean; handRaised?: boolean; isSpotlight?: boolean;
  onPin?: () => void; size?: "small" | "normal" | "large"; className?: string;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const gradient = useMemo(() => getAvatarGradient(name), [name]);

  // Bind stream to video element imperatively
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    if (stream) el.play().catch(() => { el.muted = true; el.play().catch(() => {}); });
  }, [stream]);

  // Bind stream to audio element (remote peers only)
  useEffect(() => {
    const el = audioRef.current;
    if (!el || isLocal) return;
    if (el.srcObject !== stream) { el.srcObject = stream; el.play().catch(() => {}); }
  }, [stream, isLocal]);

  // Poll for active video tracks
  useEffect(() => {
    if (!stream) { setHasVideo(false); return; }
    const check = () => {
      const vt = stream.getVideoTracks();
      setHasVideo(vt.length > 0 && vt.some(t => t.readyState === "live" && t.enabled));
    };
    check();
    stream.addEventListener("addtrack", check);
    stream.addEventListener("removetrack", check);
    const poll = setInterval(check, 800);
    return () => {
      stream.removeEventListener("addtrack", check);
      stream.removeEventListener("removetrack", check);
      clearInterval(poll);
    };
  }, [stream]);

  // Speaking detection via audio analyser
  useEffect(() => {
    if (!stream || !micOn) { setIsSpeaking(false); return; }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx || stream.getAudioTracks().length === 0) return;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const iv = setInterval(() => {
        analyser.getByteFrequencyData(data);
        setIsSpeaking(data.reduce((a, b) => a + b, 0) / data.length > 18);
      }, 200);
      return () => { clearInterval(iv); ctx.close().catch(() => {}); };
    } catch {}
  }, [stream, micOn]);

  const showVideo = isLocal ? (cameraOn && !!stream) : (cameraOn && hasVideo);
  const avatarSize = size === "small" ? "w-10 h-10 text-sm" : size === "large" ? "w-20 h-20 text-3xl" : "w-14 h-14 text-xl";

  return (
    <div className={cn(
      "relative bg-[#1A1A1D] overflow-hidden flex items-center justify-center group transition-all duration-300",
      size === "small" ? "rounded-xl" : "rounded-2xl",
      isSpeaking ? "ring-2 ring-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.25)]" : "ring-1 ring-white/[0.06]",
      className
    )}>
      <video ref={videoRef} autoPlay playsInline muted={isLocal}
        className={cn("w-full h-full object-cover absolute inset-0 transition-opacity duration-300",
          showVideo ? "opacity-100" : "opacity-0 pointer-events-none")} />

      {!isLocal && <audio ref={audioRef} autoPlay playsInline className="hidden" />}

      {!showVideo && (
        <div className="flex flex-col items-center justify-center gap-2 z-10">
          <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-lg", gradient, avatarSize)}>
            {name.charAt(0).toUpperCase()}
          </div>
          {size !== "small" && (
            <span className="text-[11px] text-white/40 font-medium">
              {!stream ? "Waiting..." : cameraOn ? "Connecting video..." : "Camera off"}
            </span>
          )}
        </div>
      )}

      {onPin && (
        <button type="button" onClick={onPin}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title={isSpotlight ? "Unpin" : "Pin"}>
          <Pin className={cn("w-3.5 h-3.5", isSpotlight && "fill-white")} />
        </button>
      )}

      {handRaised && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-400/90 text-black text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-bounce">
          <Hand className="w-3 h-3" /><span className="hidden sm:inline">Raised</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("font-semibold text-white truncate", size === "small" ? "text-[10px]" : "text-xs")}>{name}</span>
          {isLocal && <span className="text-[9px] text-white/50">(You)</span>}
          {isInstructor && <span className="px-1.5 py-px rounded text-[8px] font-bold uppercase bg-emerald-500/90 text-white tracking-wider">Host</span>}
        </div>
        <div className={cn("p-1 rounded-md shrink-0", micOn ? "text-emerald-400" : "bg-red-500/80 text-white")}>
          {micOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
}

function NotesEditor({ sessionId }: { sessionId: string }) {
  const storageKey = `knotted-live-notes-${sessionId}`;
  const [content, setContent] = useState("");
  useEffect(() => { const s = localStorage.getItem(storageKey); if (s) setContent(s); }, [storageKey]);
  const handleChange = (v: string) => { setContent(v); localStorage.setItem(storageKey, v); };
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 border-b border-white/[0.06]">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-violet-400" />My Session Notes
        </h3>
        <p className="text-[10px] text-white/30 mt-0.5">Personal notes — only visible to you</p>
      </div>
      <div className="flex-1 p-3 overflow-hidden">
        <textarea value={content} onChange={e => handleChange(e.target.value)}
          placeholder={"Take notes during the session...\n\n\u2022 Key concepts\n\u2022 Questions to ask\n\u2022 Action items"}
          className="w-full h-full bg-transparent text-[13px] text-white/80 placeholder-white/20 resize-none outline-none leading-relaxed font-mono"
          spellCheck={false} />
      </div>
      <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] text-white/20 font-mono">Auto-saved locally</span>
        <span className="text-[10px] text-white/20 font-mono">{content.length} chars</span>
      </div>
    </div>
  );
}

export function LiveRoomClient({
  session, attendees: initialAttendees, initialMessages, user, isInstructor,
}: LiveRoomClientProps) {
  const liveTimer = useLiveTimer();

  // Media
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // View
  const [viewMode, setViewMode] = useState<"grid" | "spotlight">("spotlight");
  const [spotlightUserId, setSpotlightUserId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<"chat" | "notes" | "info">("chat");
  const [peoplePanelOpen, setPeoplePanelOpen] = useState(true);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [roomNotification, setRoomNotification] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // DB
  const [attendees, setAttendees] = useState<AttendeeItem[]>(initialAttendees);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLiveActive, setIsLiveActive] = useState(session.isLive);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastSignalIdRef = useRef<string | null>(null);

  // WebRTC
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerStatuses, setPeerStatuses] = useState<Map<string, { micOn: boolean; cameraOn: boolean; handRaised: boolean }>>(new Map());

  const triggerNotification = useCallback((text: string) => {
    setRoomNotification(text);
    setTimeout(() => setRoomNotification(null), 4000);
  }, []);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendReaction = (emoji: string) => {
    setShowReactions(false);
    const id = Date.now(), x = 20 + Math.random() * 60;
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 2500);
    sendLiveSignalAction(session.id, null, "reaction", JSON.stringify({ emoji, name: user.name || user.email })).catch(() => {});
  };

  const getOrCreatePeerConnection = useCallback((peerId: string) => {
    const existing = peerConnections.current.get(peerId);
    if (existing && existing.connectionState !== "closed" && existing.connectionState !== "failed") return existing;
    if (existing) { existing.close(); peerConnections.current.delete(peerId); }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const stream = screenStreamRef.current || localStreamRef.current;
    if (stream) stream.getTracks().forEach(track => { try { pc.addTrack(track, stream); } catch {} });

    pc.ontrack = (event) => {
      const incoming = event.streams?.[0] ?? new MediaStream([event.track]);
      setRemoteStreams(prev => {
        const next = new Map(prev);
        const ex = next.get(peerId);
        if (ex) {
          // Merge into existing stream to keep video srcObject reference stable
          event.streams?.[0]?.getTracks().forEach(t => {
            if (!ex.getTrackById(t.id)) { try { ex.addTrack(t); } catch {} }
          });
          next.set(peerId, ex);
        } else {
          next.set(peerId, incoming);
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
      if (state === "connected") setConnectionStatus("connected");
      else if (state === "failed") {
        pc.close(); peerConnections.current.delete(peerId);
        setRemoteStreams(prev => { const n = new Map(prev); n.delete(peerId); return n; });
      } else if (state === "disconnected" || state === "closed") {
        setRemoteStreams(prev => { const n = new Map(prev); n.delete(peerId); return n; });
        peerConnections.current.delete(peerId);
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [session.id]);

  const sendOffer = useCallback(async (peerId: string) => {
    try {
      const pc = getOrCreatePeerConnection(peerId);
      if (pc.signalingState !== "stable") return;
      const stream = screenStreamRef.current || localStreamRef.current;
      if (stream) {
        const senders = pc.getSenders();
        stream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) sender.replaceTrack(track).catch(() => {});
          else { try { pc.addTrack(track, stream); } catch {} }
        });
      }
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      const complete = await waitForIceGathering(pc);
      if (complete) await sendLiveSignalAction(session.id, peerId, "offer", JSON.stringify(complete));
    } catch {}
  }, [getOrCreatePeerConnection, session.id]);

  const initMedia = useCallback(async () => {
    setMediaLoading(true); setStreamError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera/Mic not supported on this browser.");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); }
        catch { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); setCameraOn(false); }
      }
      localStreamRef.current = stream; setLocalStream(stream);
      peerConnections.current.forEach(pc => {
        const senders = pc.getSenders();
        stream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) sender.replaceTrack(track).catch(() => {});
          else { try { pc.addTrack(track, stream); } catch {} }
        });
      });
      await sendLiveSignalAction(session.id, null, "join", JSON.stringify({ name: user.name || user.email }));
      setConnectionStatus("connecting");
    } catch (err: unknown) {
      setStreamError(err instanceof Error ? err.message : "Could not access camera/microphone.");
    } finally { setMediaLoading(false); }
  }, [session.id, user.name, user.email]);

  const joinSentRef = useRef(false);
  useEffect(() => {
    if (!joinSentRef.current) { joinSentRef.current = true; initMedia(); }
    const handleBeforeUnload = () => leaveLiveSessionAction(session.id);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      leaveLiveSessionAction(session.id).catch(() => {});
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
    };
  }, [initMedia, session.id]);

  // Signal polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { signals } = await getLiveSignalsAction(session.id, lastSignalIdRef.current);
        if (!signals || signals.length === 0) return;
        lastSignalIdRef.current = signals[signals.length - 1].id;

        const lastOfferIdx = new Map<string, number>();
        signals.forEach((sig, idx) => { if (sig.type === "offer") lastOfferIdx.set(sig.senderId, idx); });
        const skipIdx = new Set<number>();
        signals.forEach((sig, idx) => {
          if (sig.type === "offer") { const l = lastOfferIdx.get(sig.senderId)!; if (idx < l) skipIdx.add(idx); }
        });

        for (let i = 0; i < signals.length; i++) {
          if (skipIdx.has(i)) continue;
          const sig = signals[i], { senderId } = sig;

          if (sig.type === "join") {
            const info = JSON.parse(sig.payload || "{}");
            triggerNotification(`\uD83D\uDC4B ${info.name || "Someone"} joined`);
            if (user.id < senderId) await sendOffer(senderId);
            sendLiveSignalAction(session.id, senderId, "status", JSON.stringify({ micOn, cameraOn, handRaised })).catch(() => {});
          } else if (sig.type === "leave") {
            const info = JSON.parse(sig.payload || "{}");
            triggerNotification(`${info.name || "Someone"} left`);
            peerConnections.current.get(senderId)?.close();
            peerConnections.current.delete(senderId);
            setRemoteStreams(prev => { const n = new Map(prev); n.delete(senderId); return n; });
            setAttendees(prev => prev.filter(a => a.id !== senderId));
          } else if (sig.type === "offer") {
            const existingPc = peerConnections.current.get(senderId);
            if (existingPc && existingPc.connectionState === "connected") continue;
            try {
              const pc = getOrCreatePeerConnection(senderId);
              const stream = screenStreamRef.current || localStreamRef.current;
              if (stream) {
                const senders = pc.getSenders();
                stream.getTracks().forEach(track => {
                  const sender = senders.find(s => s.track?.kind === track.kind);
                  if (sender) sender.replaceTrack(track).catch(() => {});
                  else { try { pc.addTrack(track, stream); } catch {} }
                });
              }
              await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sig.payload)));
              const queued = iceCandidateQueue.current.get(senderId) || [];
              for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              iceCandidateQueue.current.delete(senderId);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              const completeAnswer = await waitForIceGathering(pc);
              if (completeAnswer) await sendLiveSignalAction(session.id, senderId, "answer", JSON.stringify(completeAnswer));
            } catch {}
          } else if (sig.type === "answer") {
            try {
              const pc = peerConnections.current.get(senderId);
              if (!pc || pc.signalingState !== "have-local-offer") continue;
              await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sig.payload)));
              const queued = iceCandidateQueue.current.get(senderId) || [];
              for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              iceCandidateQueue.current.delete(senderId);
            } catch {}
          } else if (sig.type === "candidate") {
            const pc = peerConnections.current.get(senderId);
            if (!pc) continue;
            const cd = JSON.parse(sig.payload);
            if (pc.remoteDescription?.type) await pc.addIceCandidate(new RTCIceCandidate(cd)).catch(() => {});
            else { const q = iceCandidateQueue.current.get(senderId) || []; q.push(cd); iceCandidateQueue.current.set(senderId, q); }
          } else if (sig.type === "status") {
            setPeerStatuses(prev => new Map(prev).set(senderId, JSON.parse(sig.payload)));
          } else if (sig.type === "reaction") {
            const data = JSON.parse(sig.payload);
            const id = Date.now() + Math.random(), x = 20 + Math.random() * 60;
            setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, x }]);
            setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 2500);
          }
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [session.id, sendOffer, getOrCreatePeerConnection, micOn, cameraOn, handRaised, user.id, triggerNotification]);

  // DB polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const state = await getLiveSessionStateAction(session.id);
        setIsLiveActive(state.isLive);
        if (state.isEnded && !isInstructor) {
          triggerNotification("\uD83D\uDCE2 The host has ended this session");
          setTimeout(() => { window.location.href = "/live"; }, 2000);
          return;
        }
        if (state.attendees.length > 0) setAttendees(state.attendees);
        if (state.messages.length > 0) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const newMsgs = state.messages.filter(m => !ids.has(m.id));
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
          });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [session.id, isInstructor, triggerNotification]);

  // If alone, auto-mark connected
  useEffect(() => {
    if (localStream && attendees.length <= 1) setConnectionStatus("connected");
  }, [localStream, attendees.length]);

  // Derived
  const otherAttendees = attendees.filter(a => a.id !== user.id);
  const totalParticipants = 1 + otherAttendees.length;
  const filteredPeople = peopleSearch
    ? otherAttendees.filter(a =>
        a.name.toLowerCase().includes(peopleSearch.toLowerCase()) ||
        a.email.toLowerCase().includes(peopleSearch.toLowerCase()))
    : otherAttendees;
  const spotlightAttendee = otherAttendees.find(a => a.id === spotlightUserId);
  const isLocalSpotlight = !spotlightUserId || spotlightUserId === user.id;

  // Controls
  function toggleMicrophone() {
    const s = localStreamRef.current;
    if (s) {
      const next = !micOn; s.getAudioTracks().forEach(t => (t.enabled = next)); setMicOn(next);
      sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn: next, cameraOn, handRaised })).catch(() => {});
    }
  }
  function toggleCamera() {
    const s = localStreamRef.current;
    if (s) {
      const next = !cameraOn; s.getVideoTracks().forEach(t => (t.enabled = next)); setCameraOn(next);
      sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn, cameraOn: next, handRaised })).catch(() => {});
    }
  }
  async function toggleScreenShare() {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop()); screenStreamRef.current = null;
      const cam = localStreamRef.current;
      if (cam) {
        peerConnections.current.forEach(pc => {
          const vs = pc.getSenders().find(s => s.track?.kind === "video");
          const lt = cam.getVideoTracks()[0];
          if (vs && lt) vs.replaceTrack(lt);
        });
        setLocalStream(cam);
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) return alert("Screen sharing not supported.");
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } as MediaTrackConstraints, audio: true });
        screenStreamRef.current = ss; setLocalStream(ss);
        const st = ss.getVideoTracks()[0];
        peerConnections.current.forEach(pc => { const vs = pc.getSenders().find(s => s.track?.kind === "video"); if (vs && st) vs.replaceTrack(st); });
        st.onended = () => toggleScreenShare(); setIsScreenSharing(true);
      } catch {}
    }
  }
  function toggleHandRaise() {
    const next = !handRaised; setHandRaised(next);
    sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn, cameraOn, handRaised: next })).catch(() => {});
  }
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;
    const text = inputMessage.trim(); setInputMessage(""); setIsSending(true);
    try {
      const res = await sendLiveChatMessageAction(session.id, text);
      if (res.success && res.message) {
        setMessages(prev => prev.some(m => m.id === res.message.id) ? prev : [...prev, res.message]);
      }
    } catch {} finally { setIsSending(false); }
  }
  async function handleLeaveRoom() {
    if (isLeaving) return;
    if (isInstructor && !window.confirm("End this live session for all participants?")) return;
    setIsLeaving(true);
    try {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      if (isInstructor) { await endLiveSessionAction(session.id); window.location.href = "/creator/live"; }
      else { await leaveLiveSessionAction(session.id); window.location.href = "/live"; }
    } catch { window.location.href = isInstructor ? "/creator/live" : "/live"; }
  }
  function copyMeetingLink() {
    navigator.clipboard?.writeText(`${window.location.origin}/live/${session.id}`);
    triggerNotification("\uD83D\uDCCB Meeting link copied!");
  }

  return (
    <div className="h-screen flex flex-col bg-[#111113] text-white overflow-hidden font-sans">
      {/* App Router compatible CSS animations */}
      <style>{`
        @keyframes knotted-float-up{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-200px) scale(1.5)}}
        @keyframes knotted-slide-down{0%{opacity:0;transform:translate(-50%,-10px)}100%{opacity:1;transform:translate(-50%,0)}}
        .knotted-float{animation:knotted-float-up 2.5s ease-out forwards}
        .knotted-toast{animation:knotted-slide-down 0.3s ease-out}
      `}</style>

      {floatingReactions.map(r => (
        <div key={r.id} className="knotted-float fixed z-[100] text-4xl pointer-events-none" style={{ left: `${r.x}%`, bottom: "120px" }}>{r.emoji}</div>
      ))}

      {roomNotification && (
        <div className="knotted-toast fixed top-4 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-xl bg-[#1E1E21]/95 border border-white/10 text-white text-xs font-semibold backdrop-blur-xl shadow-2xl flex items-center gap-2">
          <span>{roomNotification}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="h-14 bg-[#1A1A1D] border-b border-white/[0.06] px-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size="sm" />
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", isLiveActive ? "bg-red-500 animate-pulse" : "bg-zinc-500")} />
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider shrink-0">{isLiveActive ? "LIVE" : "OFFLINE"}</span>
            <span className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-[400px]">{session.title}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.06] text-xs font-mono text-white/70">
            <Clock className="w-3.5 h-3.5 text-white/40" /><span>{liveTimer}</span>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border",
            connectionStatus === "connected" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
            connectionStatus === "connecting" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
            "bg-red-500/10 border-red-500/20 text-red-400")}>
            {connectionStatus === "connected" ? <Wifi className="w-3 h-3" /> : connectionStatus === "connecting" ? <Loader2 className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => setPeoplePanelOpen(!peoplePanelOpen)}
            className={cn("hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              peoplePanelOpen ? "bg-white/10 text-white" : "bg-transparent text-white/50 hover:text-white hover:bg-white/[0.05]")}>
            <Users className="w-3.5 h-3.5" /><span>{totalParticipants}</span>
          </button>
          <button type="button" onClick={handleLeaveRoom} disabled={isLeaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold transition-colors">
            {isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isInstructor ? "End" : "Leave"}</span>
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* People Panel */}
        {peoplePanelOpen && (
          <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-[#151517] border-r border-white/[0.06] shrink-0">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-bold text-white/70">People ({totalParticipants})</span>
              <button type="button" onClick={() => setPeoplePanelOpen(false)} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input type="text" value={peopleSearch} onChange={e => setPeopleSearch(e.target.value)} placeholder="Search people..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/[0.05] border border-white/[0.06] text-xs text-white placeholder-white/30 outline-none focus:border-white/15" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
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
              {filteredPeople.map(att => {
                const ps = peerStatuses.get(att.id), isConnected = !!remoteStreams.get(att.id);
                return (
                  <div key={att.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                    onClick={() => { setSpotlightUserId(att.id); setViewMode("spotlight"); }}>
                    <div className="relative">
                      <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[11px] font-bold text-white shrink-0", getAvatarGradient(att.name))}>
                        {att.name.charAt(0).toUpperCase()}
                      </div>
                      {ps?.handRaised && <span className="absolute -top-1 -right-1 text-[10px] animate-bounce">{"\u270B"}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-white/80 truncate block">{att.name}</span>
                      <span className={cn("text-[9px] font-semibold uppercase", isConnected ? "text-emerald-400" : "text-white/30")}>{isConnected ? "\u25CF Live" : att.role || "Student"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(ps?.micOn ?? true) ? <Mic className="w-3 h-3 text-emerald-400/60" /> : <MicOff className="w-3 h-3 text-red-400/60" />}
                    </div>
                  </div>
                );
              })}
              {filteredPeople.length === 0 && (
                <div className="py-6 text-center">
                  <Users className="w-6 h-6 mx-auto text-white/10 mb-1" />
                  <p className="text-[10px] text-white/20">{peopleSearch ? "No results" : "Waiting for others..."}</p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* CENTER */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#111113] relative">
          <DRMShield userEmail={user.email} userId={user.id} />

          {mediaLoading && (
            <div className="absolute inset-0 z-30 bg-[#111113] flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-white/40 animate-spin" />
              </div>
              <p className="text-sm text-white/40 font-medium">Setting up your camera & mic...</p>
              <p className="text-xs text-white/20">Please allow camera and microphone access when prompted</p>
            </div>
          )}

          {streamError && !mediaLoading && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{streamError}</span>
              <button type="button" onClick={initMedia}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold transition-colors">
                <RefreshCw className="w-3 h-3" />Retry
              </button>
            </div>
          )}

          <div className="flex-1 p-3 sm:p-4 flex flex-col min-h-0">
            {viewMode === "spotlight" ? (
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex-1 min-h-0">
                  {isLocalSpotlight ? (
                    <VideoTile stream={localStream} name={user.name || user.email} isLocal isInstructor={isInstructor}
                      micOn={micOn} cameraOn={cameraOn || isScreenSharing} handRaised={handRaised} isSpotlight size="large" className="w-full h-full" />
                  ) : spotlightAttendee ? (
                    <VideoTile stream={remoteStreams.get(spotlightAttendee.id) ?? null} name={spotlightAttendee.name}
                      isInstructor={spotlightAttendee.role === "INSTRUCTOR"}
                      micOn={peerStatuses.get(spotlightAttendee.id)?.micOn ?? true}
                      cameraOn={peerStatuses.get(spotlightAttendee.id)?.cameraOn ?? true}
                      handRaised={peerStatuses.get(spotlightAttendee.id)?.handRaised ?? false}
                      isSpotlight onPin={() => setSpotlightUserId(null)} size="large" className="w-full h-full" />
                  ) : null}
                </div>
                <div className="h-[88px] flex items-center gap-2 overflow-x-auto shrink-0 pb-1">
                  {!isLocalSpotlight && (
                    <div className="w-[130px] h-full shrink-0">
                      <VideoTile stream={localStream} name={user.name || user.email} isLocal isInstructor={isInstructor}
                        micOn={micOn} cameraOn={cameraOn || isScreenSharing} handRaised={handRaised}
                        onPin={() => setSpotlightUserId(null)} size="small" className="w-full h-full cursor-pointer" />
                    </div>
                  )}
                  {otherAttendees.map(att => {
                    if (att.id === spotlightUserId) return null;
                    const ps = peerStatuses.get(att.id);
                    return (
                      <div key={att.id} className="w-[130px] h-full shrink-0">
                        <VideoTile stream={remoteStreams.get(att.id) ?? null} name={att.name}
                          isInstructor={att.role === "INSTRUCTOR"}
                          micOn={ps?.micOn ?? true} cameraOn={ps?.cameraOn ?? true} handRaised={ps?.handRaised ?? false}
                          onPin={() => { setSpotlightUserId(att.id); setViewMode("spotlight"); }}
                          size="small" className="w-full h-full cursor-pointer" />
                      </div>
                    );
                  })}
                  {isLocalSpotlight && otherAttendees.length === 0 && (
                    <div className="flex items-center px-4 text-white/20 text-xs gap-2">
                      <Users className="w-4 h-4" /><span>Waiting for participants to join...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={cn("flex-1 grid gap-3 auto-rows-fr",
                totalParticipants === 1 && "grid-cols-1", totalParticipants === 2 && "grid-cols-1 sm:grid-cols-2",
                totalParticipants >= 3 && totalParticipants <= 4 && "grid-cols-2",
                totalParticipants >= 5 && totalParticipants <= 6 && "grid-cols-2 md:grid-cols-3",
                totalParticipants > 6 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4")}>
                <VideoTile stream={localStream} name={user.name || user.email} isLocal isInstructor={isInstructor}
                  micOn={micOn} cameraOn={cameraOn || isScreenSharing} handRaised={handRaised}
                  onPin={() => { setSpotlightUserId(user.id); setViewMode("spotlight"); }} className="w-full h-full" />
                {otherAttendees.map(att => {
                  const ps = peerStatuses.get(att.id);
                  return (
                    <VideoTile key={att.id} stream={remoteStreams.get(att.id) ?? null} name={att.name}
                      isInstructor={att.role === "INSTRUCTOR"}
                      micOn={ps?.micOn ?? true} cameraOn={ps?.cameraOn ?? true} handRaised={ps?.handRaised ?? false}
                      onPin={() => { setSpotlightUserId(att.id); setViewMode("spotlight"); }} className="w-full h-full" />
                  );
                })}
              </div>
            )}
          </div>

          {/* Control Bar */}
          <div className="pb-4 px-4 flex justify-center shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 p-2 rounded-2xl bg-[#1E1E21]/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl">
              <button type="button" onClick={toggleMicrophone} title={micOn ? "Mute" : "Unmute"}
                className={cn("p-2.5 sm:p-3 rounded-xl transition-all", micOn ? "bg-white/[0.08] text-white hover:bg-white/15" : "bg-red-600 text-white")}>
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button type="button" onClick={toggleCamera} title={cameraOn ? "Camera Off" : "Camera On"}
                className={cn("p-2.5 sm:p-3 rounded-xl transition-all", cameraOn ? "bg-white/[0.08] text-white hover:bg-white/15" : "bg-red-600 text-white")}>
                {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button type="button" onClick={toggleScreenShare} title="Screen Share"
                className={cn("p-2.5 sm:p-3 rounded-xl transition-all", isScreenSharing ? "bg-emerald-500 text-black" : "bg-white/[0.08] text-white hover:bg-white/15")}>
                <Monitor className="w-5 h-5" />
              </button>
              <button type="button" onClick={toggleHandRaise} title="Raise Hand"
                className={cn("p-2.5 sm:p-3 rounded-xl transition-all", handRaised ? "bg-amber-400 text-black" : "bg-white/[0.08] text-white hover:bg-white/15")}>
                <Hand className="w-5 h-5" />
              </button>
              <div className="w-px h-7 bg-white/10 mx-0.5" />
              <div className="relative">
                <button type="button" onClick={() => setShowReactions(!showReactions)} title="Reactions"
                  className="p-2.5 sm:p-3 rounded-xl bg-white/[0.08] text-white hover:bg-white/15 transition-all">
                  <SmilePlus className="w-5 h-5" />
                </button>
                {showReactions && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 p-2 rounded-xl bg-[#1E1E21] border border-white/10 shadow-2xl">
                    {REACTIONS.map(r => (
                      <button key={r.emoji} type="button" onClick={() => sendReaction(r.emoji)} title={r.label}
                        className="text-xl hover:scale-125 transition-transform p-1">{r.emoji}</button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setViewMode(viewMode === "spotlight" ? "grid" : "spotlight")}
                title={viewMode === "spotlight" ? "Gallery view" : "Speaker view"}
                className="p-2.5 sm:p-3 rounded-xl bg-white/[0.08] text-white hover:bg-white/15 transition-all">
                {viewMode === "spotlight" ? <LayoutGrid className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <div className="w-px h-7 bg-white/10 mx-0.5" />
              <button type="button" onClick={handleLeaveRoom} disabled={isLeaving}
                className="p-2.5 sm:p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all lg:hidden disabled:opacity-60">
                {isLeaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-[340px] bg-[#151517] border-l border-white/[0.06] shrink-0">
          <div className="p-2 border-b border-white/[0.06] flex items-center gap-1">
            {([
              { key: "chat" as const, icon: MessageSquare, label: "Chat" },
              { key: "notes" as const, icon: FileText, label: "Notes" },
              { key: "info" as const, icon: Info, label: "Info" },
            ]).map(tab => (
              <button key={tab.key} type="button" onClick={() => setActiveSideTab(tab.key)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-colors",
                  activeSideTab === tab.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]")}>
                <tab.icon className="w-3.5 h-3.5" /><span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeSideTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {messages.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 mx-auto text-white/10 mb-2" />
                    <p className="text-[11px] text-white/30">No messages yet. Start the conversation!</p>
                  </div>
                ) : messages.map(m => (
                  <div key={m.id}>
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
                    <div className="ml-7 px-3 py-2 rounded-xl bg-white/[0.04] text-xs text-white/70 leading-relaxed">{m.text}</div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.06] flex items-center gap-2">
                <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Type a message..." maxLength={500}
                  className="flex-1 h-9 px-3 rounded-lg bg-white/[0.05] border border-white/[0.06] text-xs text-white placeholder-white/30 outline-none focus:border-white/15" />
                <button type="submit" disabled={isSending || !inputMessage.trim()}
                  className="h-9 w-9 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors">
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {activeSideTab === "notes" && <div className="flex-1 min-h-0"><NotesEditor sessionId={session.id} /></div>}

          {activeSideTab === "info" && (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">{session.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{session.description || "Live interactive session."}</p>
              </div>
              <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-white/60"><Sparkles className="w-3.5 h-3.5 text-violet-400" /><span className="font-medium">{session.course.title}</span></div>
                <div className="flex items-center gap-2 text-xs text-white/60"><Clock className="w-3.5 h-3.5 text-white/30" /><span>Duration: {session.durationMin} minutes</span></div>
                <div className="flex items-center gap-2 text-xs text-white/60"><Users className="w-3.5 h-3.5 text-white/30" /><span>{totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}</span></div>
              </div>
              <div className="space-y-2">
                <button type="button" onClick={copyMeetingLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.06] text-xs font-semibold text-white/70 transition-colors">
                  <Copy className="w-3.5 h-3.5" /><span>Copy Meeting Link</span>
                </button>
                <Link href={`/courses/${session.course.slug}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-xs font-semibold text-violet-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /><span>View Course Page</span>
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
