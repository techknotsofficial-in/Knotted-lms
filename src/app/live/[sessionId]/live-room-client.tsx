"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Enterprise STUN & Open TURN Relays
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

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
  className?: string;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio level analyser for speaking green ring
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
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setIsSpeaking(average > 18);
      }, 200);

      return () => {
        clearInterval(interval);
        audioContext.close().catch(() => {});
      };
    } catch {}
  }, [stream, micOn]);

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-[#09090B] overflow-hidden flex items-center justify-center group shadow-lg transition-all duration-300",
        isSpeaking ? "border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]" : "border border-white/10",
        className
      )}
    >
      {/* Real-time Video Stream with Direct Ref Callback */}
      {cameraOn && stream ? (
        <video
          ref={(el) => {
            if (el) {
              if (el.srcObject !== stream) {
                el.srcObject = stream;
              }
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-contain bg-[#09090B]"
        />
      ) : (
        /* Fallback Display */
        <div className="flex flex-col items-center justify-center p-4 space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#27272A] border-2 border-white/20 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-xl">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-medium">
            {cameraOn ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Connecting live video...</span>
              </>
            ) : (
              <span>Camera Off</span>
            )}
          </div>
        </div>
      )}

      {/* Dedicated Audio Pipeline for Remote Attendees */}
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

      {/* Pin / Spotlight button */}
      {onPin && (
        <button
          type="button"
          onClick={onPin}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white hover:bg-black/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title={isSpotlight ? "Unpin Participant" : "Pin Participant"}
        >
          <Pin className={cn("w-3.5 h-3.5", isSpotlight && "fill-white text-white")} />
        </button>
      )}

      {/* Hand Raised Badge */}
      {handRaised && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-400 text-black text-[11px] font-bold flex items-center gap-1 shadow-lg animate-bounce z-10">
          <Hand className="w-3 h-3" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Bottom Info Bar */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 max-w-[85%]">
          <span className="text-[11px] font-bold text-white truncate">
            {name} {isLocal && "(You)"}
          </span>
          {isInstructor && (
            <Badge variant="mint" className="text-[9px] px-1 py-0 uppercase font-black">
              Host
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "p-1.5 rounded-lg backdrop-blur-md border",
            micOn
              ? "bg-black/70 border-white/10 text-emerald-400"
              : "bg-red-600/90 border-red-500/30 text-white"
          )}
        >
          {micOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
}

export function LiveRoomClient({
  session,
  attendees: initialAttendees,
  initialMessages,
  user,
  isInstructor,
}: LiveRoomClientProps) {
  const router = useRouter();

  // Local Media Streams
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "spotlight">("spotlight");
  const [spotlightUserId, setSpotlightUserId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<"chat" | "attendees">("chat");

  const [roomNotification, setRoomNotification] = useState<string | null>(null);

  // WebRTC Remote Peer Connections & Streams
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerStatuses, setPeerStatuses] = useState<
    Map<string, { micOn: boolean; cameraOn: boolean; handRaised: boolean }>
  >(new Map());

  // Database Attendance & Chat State
  const [attendees, setAttendees] = useState<AttendeeItem[]>(initialAttendees);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLiveActive, setIsLiveActive] = useState(session.isLive);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastSignalTimeRef = useRef<string>(new Date(Date.now() - 20000).toISOString());

  const triggerNotification = (text: string) => {
    setRoomNotification(text);
    setTimeout(() => setRoomNotification(null), 4000);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper to create and wire up an RTCPeerConnection for a peer
  const getOrCreatePeerConnection = useCallback(
    (peerId: string) => {
      if (peerConnections.current.has(peerId)) {
        return peerConnections.current.get(peerId)!;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local stream tracks immediately if available
      const stream = screenStreamRef.current || localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, stream);
          } catch {}
        });
      }

      // Handle receiving remote tracks
      pc.ontrack = (event) => {
        console.log("WebRTC ontrack received:", event.track.kind, "from peer", peerId);
        const rStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          const existing = next.get(peerId);
          if (existing) {
            if (!existing.getTracks().some((t) => t.id === event.track.id)) {
              existing.addTrack(event.track);
            }
            next.set(peerId, new MediaStream(existing.getTracks()));
          } else {
            next.set(peerId, rStream);
          }
          return next;
        });
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendLiveSignalAction(
            session.id,
            peerId,
            "candidate",
            JSON.stringify(event.candidate)
          ).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
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
    [session.id]
  );

  // Send Offer (Deterministic: Only initiated when polite condition met or requested)
  const sendOffer = useCallback(
    async (peerId: string) => {
      try {
        const pc = getOrCreatePeerConnection(peerId);
        const stream = screenStreamRef.current || localStreamRef.current;
        if (stream) {
          stream.getTracks().forEach((track) => {
            const senders = pc.getSenders();
            if (!senders.some((s) => s.track?.kind === track.kind)) {
              try {
                pc.addTrack(track, stream);
              } catch {}
            }
          });
        }

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        await sendLiveSignalAction(session.id, peerId, "offer", JSON.stringify(offer));
      } catch (err) {
        console.warn("Failed to create offer:", err);
      }
    },
    [getOrCreatePeerConnection, session.id]
  );

  // 1. Initialize Local Camera & Microphone
  const initMedia = useCallback(async () => {
    try {
      setStreamError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera/Mic not supported by this browser.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Attach tracks to any already created peer connections
      peerConnections.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          if (!senders.some((s) => s.track?.kind === track.kind)) {
            try {
              pc.addTrack(track, stream);
            } catch {}
          }
        });
      });

      // Announce join to peers in the room
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

  useEffect(() => {
    initMedia();

    const handleBeforeUnload = () => {
      leaveLiveSessionAction(session.id);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      leaveLiveSessionAction(session.id);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
    };
  }, [initMedia, session.id]);

  // 2. Realtime WebRTC Fast Signaling Polling with Glare Prevention
  useEffect(() => {
    const signalInterval = setInterval(async () => {
      try {
        const { signals } = await getLiveSignalsAction(session.id, lastSignalTimeRef.current);
        if (signals && signals.length > 0) {
          lastSignalTimeRef.current = signals[signals.length - 1].createdAt;

          for (const sig of signals) {
            const senderId = sig.senderId;

            if (sig.type === "join") {
              const info = JSON.parse(sig.payload || "{}");
              triggerNotification(`👋 ${info.name || "A participant"} joined`);

              // Glare Prevention: Peer with smaller ID initiates offer to peer with larger ID
              if (user.id < senderId) {
                await sendOffer(senderId);
              }
              sendLiveSignalAction(
                session.id,
                senderId,
                "status",
                JSON.stringify({ micOn, cameraOn, handRaised })
              ).catch(() => {});
            } else if (sig.type === "leave") {
              const info = JSON.parse(sig.payload || "{}");
              triggerNotification(`🚪 ${info.name || "A participant"} left`);
              if (peerConnections.current.has(senderId)) {
                peerConnections.current.get(senderId)?.close();
                peerConnections.current.delete(senderId);
              }
              setRemoteStreams((prev) => {
                const next = new Map(prev);
                next.delete(senderId);
                return next;
              });
              setAttendees((prev) => prev.filter((a) => a.id !== senderId));
            } else if (sig.type === "offer") {
              const pc = getOrCreatePeerConnection(senderId);
              const offerData = JSON.parse(sig.payload);

              // Attach local tracks before answering
              const stream = screenStreamRef.current || localStreamRef.current;
              if (stream) {
                stream.getTracks().forEach((track) => {
                  const senders = pc.getSenders();
                  if (!senders.some((s) => s.track?.kind === track.kind)) {
                    try {
                      pc.addTrack(track, stream);
                    } catch {}
                  }
                });
              }

              await pc.setRemoteDescription(new RTCSessionDescription(offerData));

              // Process queued candidates
              const queued = iceCandidateQueue.current.get(senderId) || [];
              for (const cand of queued) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
              iceCandidateQueue.current.delete(senderId);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendLiveSignalAction(session.id, senderId, "answer", JSON.stringify(answer));
            } else if (sig.type === "answer") {
              const pc = getOrCreatePeerConnection(senderId);
              const answerData = JSON.parse(sig.payload);
              if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(answerData));
                const queued = iceCandidateQueue.current.get(senderId) || [];
                for (const cand of queued) {
                  await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }
                iceCandidateQueue.current.delete(senderId);
              }
            } else if (sig.type === "candidate") {
              const pc = getOrCreatePeerConnection(senderId);
              const candidateData = JSON.parse(sig.payload);
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(candidateData)).catch(() => {});
              } else {
                const queued = iceCandidateQueue.current.get(senderId) || [];
                queued.push(candidateData);
                iceCandidateQueue.current.set(senderId, queued);
              }
            } else if (sig.type === "status") {
              const status = JSON.parse(sig.payload);
              setPeerStatuses((prev) => new Map(prev).set(senderId, status));
            }
          }
        }
      } catch {}
    }, 1000);

    return () => clearInterval(signalInterval);
  }, [session.id, sendOffer, getOrCreatePeerConnection, micOn, cameraOn, handRaised, user.id]);

  // 3. Database State Polling (Every 3s)
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

  // Controls: Mic Toggle
  function toggleMicrophone() {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      const nextState = !micOn;
      audioTracks.forEach((t) => (t.enabled = nextState));
      setMicOn(nextState);
      sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn: nextState, cameraOn, handRaised })).catch(() => {});
    }
  }

  // Controls: Camera Toggle
  function toggleCamera() {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      const nextState = !cameraOn;
      videoTracks.forEach((t) => (t.enabled = nextState));
      setCameraOn(nextState);
      sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn, cameraOn: nextState, handRaised })).catch(() => {});
    }
  }

  // Controls: Screen Share Toggle
  async function toggleScreenShare() {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current) {
        peerConnections.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          const localVideoTrack = localStreamRef.current?.getVideoTracks()[0];
          if (videoSender && localVideoTrack) {
            videoSender.replaceTrack(localVideoTrack);
          }
        });
      }
      setLocalStream(localStreamRef.current);
      setIsScreenSharing(false);
    } else {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          alert("Screen sharing is not supported in this browser.");
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" },
          audio: true,
        });

        screenStreamRef.current = screenStream;
        setLocalStream(screenStream);

        const screenTrack = screenStream.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender && screenTrack) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch {}
    }
  }

  // Controls: Raise Hand
  function toggleHandRaise() {
    const nextState = !handRaised;
    setHandRaised(nextState);
    sendLiveSignalAction(session.id, null, "status", JSON.stringify({ micOn, cameraOn, handRaised: nextState })).catch(() => {});
  }

  // Controls: Send Chat Message
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
    } catch {
    } finally {
      setIsSending(false);
    }
  }

  // Controls: Leave / End Call
  async function handleLeaveRoom() {
    if (isInstructor) {
      if (confirm("End this live cohort stream for all attendees?")) {
        await endLiveSessionAction(session.id);
        router.push("/creator/live");
      }
    } else {
      await leaveLiveSessionAction(session.id);
      router.push(`/live`);
    }
  }

  const otherAttendees = attendees.filter((a) => a.id !== user.id);
  const totalParticipants = 1 + otherAttendees.length;

  const spotlightAttendee = otherAttendees.find((a) => a.id === spotlightUserId);
  const isLocalSpotlight = !spotlightUserId || spotlightUserId === user.id;

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-white select-none overflow-hidden font-sans">
      {/* Live Toast Notification */}
      {roomNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black/80 border border-white/20 text-white text-xs font-bold backdrop-blur-xl shadow-2xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{roomNotification}</span>
        </div>
      )}

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
            <span>{totalParticipants} In Classroom</span>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl h-9 px-4 shadow-md"
          >
            <PhoneOff className="w-3.5 h-3.5 mr-1" />
            {isInstructor ? "End Stream" : "Leave"}
          </Button>
        </div>
      </header>

      {/* Main Classroom Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* Left Columns: Video Stage Area */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between p-4 sm:p-6 bg-black/90 relative overflow-hidden">
          <DRMShield userEmail={user.email} userId={user.id} />

          {streamError && (
            <div className="mb-3 p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Camera Notice: {streamError} — Allow camera permissions in your browser.</span>
            </div>
          )}

          {/* MODE A: SPOTLIGHT VIEW */}
          {viewMode === "spotlight" && (
            <div className="flex-1 flex flex-col min-h-0 gap-4">
              {/* Main Spotlight Video */}
              <div className="flex-1 min-h-[340px] rounded-3xl overflow-hidden shadow-2xl relative">
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
                    className="w-full h-full"
                  />
                ) : (
                  <VideoTile
                    stream={remoteStreams.get(spotlightAttendee!.id) || null}
                    name={spotlightAttendee!.name}
                    isLocal={false}
                    isInstructor={spotlightAttendee!.role === "INSTRUCTOR"}
                    micOn={peerStatuses.get(spotlightAttendee!.id)?.micOn ?? true}
                    cameraOn={peerStatuses.get(spotlightAttendee!.id)?.cameraOn ?? true}
                    handRaised={peerStatuses.get(spotlightAttendee!.id)?.handRaised ?? false}
                    isSpotlight={true}
                    onPin={() => setSpotlightUserId(null)}
                    className="w-full h-full"
                  />
                )}
              </div>

              {/* Bottom Filmstrip for Other Participants */}
              {totalParticipants > 1 && (
                <div className="h-32 flex items-center gap-3 overflow-x-auto pb-1 shrink-0">
                  {!isLocalSpotlight && (
                    <div className="w-44 h-full shrink-0">
                      <VideoTile
                        stream={localStream}
                        name={user.name || user.email}
                        isLocal={true}
                        isInstructor={isInstructor}
                        micOn={micOn}
                        cameraOn={cameraOn || isScreenSharing}
                        handRaised={handRaised}
                        onPin={() => setSpotlightUserId(user.id)}
                        className="w-full h-full cursor-pointer hover:border-emerald-400"
                      />
                    </div>
                  )}

                  {otherAttendees.map((att) => {
                    if (att.id === spotlightUserId) return null;
                    const rStream = remoteStreams.get(att.id) || null;
                    const pStatus = peerStatuses.get(att.id);

                    return (
                      <div key={att.id} className="w-44 h-full shrink-0">
                        <VideoTile
                          stream={rStream}
                          name={att.name}
                          isLocal={false}
                          isInstructor={att.role === "INSTRUCTOR"}
                          micOn={pStatus?.micOn ?? true}
                          cameraOn={pStatus?.cameraOn ?? true}
                          handRaised={pStatus?.handRaised ?? false}
                          onPin={() => setSpotlightUserId(att.id)}
                          className="w-full h-full cursor-pointer hover:border-emerald-400"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODE B: GALLERY GRID VIEW */}
          {viewMode === "grid" && (
            <div
              className={cn(
                "flex-1 grid gap-4 p-1 min-h-[380px] auto-rows-fr",
                totalParticipants === 1 && "grid-cols-1",
                totalParticipants === 2 && "grid-cols-1 sm:grid-cols-2",
                totalParticipants >= 3 && totalParticipants <= 4 && "grid-cols-2",
                totalParticipants >= 5 && totalParticipants <= 6 && "grid-cols-2 md:grid-cols-3",
                totalParticipants > 6 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              )}
            >
              <VideoTile
                stream={localStream}
                name={user.name || user.email}
                isLocal={true}
                isInstructor={isInstructor}
                micOn={micOn}
                cameraOn={cameraOn || isScreenSharing}
                handRaised={handRaised}
                onPin={() => {
                  setSpotlightUserId(user.id);
                  setViewMode("spotlight");
                }}
                className="w-full h-full"
              />

              {otherAttendees.map((att) => {
                const rStream = remoteStreams.get(att.id) || null;
                const pStatus = peerStatuses.get(att.id);

                return (
                  <VideoTile
                    key={att.id}
                    stream={rStream}
                    name={att.name}
                    isLocal={false}
                    isInstructor={att.role === "INSTRUCTOR"}
                    micOn={pStatus?.micOn ?? true}
                    cameraOn={pStatus?.cameraOn ?? true}
                    handRaised={pStatus?.handRaised ?? false}
                    onPin={() => {
                      setSpotlightUserId(att.id);
                      setViewMode("spotlight");
                    }}
                    className="w-full h-full"
                  />
                );
              })}
            </div>
          )}

          {/* Bottom Floating Control Bar */}
          <div className="mt-4 flex items-center justify-center gap-3 p-3 rounded-2xl bg-[#18181B]/80 border border-white/10 backdrop-blur-xl max-w-fit mx-auto shadow-2xl">
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

            <button
              type="button"
              onClick={toggleScreenShare}
              className={cn(
                "p-3 rounded-xl transition-all",
                isScreenSharing
                  ? "bg-emerald-500 text-black font-bold shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={toggleHandRaise}
              className={cn(
                "p-3 rounded-xl transition-all",
                handRaised ? "bg-amber-400 text-black font-bold shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
              )}
              title="Raise Hand to Ask Question"
            >
              <Hand className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-white/20 mx-1" />

            <button
              type="button"
              onClick={() => setViewMode(viewMode === "spotlight" ? "grid" : "spotlight")}
              className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
              title={viewMode === "spotlight" ? "Switch to Gallery Grid View" : "Switch to Spotlight View"}
            >
              {viewMode === "spotlight" ? <LayoutGrid className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Right 3/4 Columns: Live Chat & Attendees Panel */}
        <div className="lg:col-span-4 xl:col-span-3 border-l border-[#27272A] bg-[#09090B] flex flex-col justify-between h-[calc(100vh-64px)]">
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
              Attendees ({totalParticipants})
            </button>
          </div>

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

          {activeSideTab === "attendees" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px]">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-white">{user.name || user.email} (You)</span>
                </div>
                <Badge variant="mint" className="text-[9px] uppercase font-bold">
                  {isInstructor ? "Host" : "Student"}
                </Badge>
              </div>

              {otherAttendees.map((attendee) => {
                const pStatus = peerStatuses.get(attendee.id);
                return (
                  <div
                    key={attendee.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#27272A] text-white flex items-center justify-center font-bold text-[10px]">
                        {attendee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#E4E4E7] font-medium">{attendee.name}</span>
                          {pStatus?.handRaised && <Hand className="w-3 h-3 text-amber-400 animate-bounce" />}
                        </div>
                        <span className="text-[10px] text-[#71717A] block">{attendee.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[#A1A1AA]">
                        {pStatus?.micOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-red-500" />}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase text-[#A1A1AA] border-white/10">
                        {attendee.role || "Student"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
