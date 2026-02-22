"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSocket, disconnectSocket } from "@/lib/socket";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Copy,
    MessageSquare, Hand, Users, Loader2, Link2
} from "lucide-react";
import type { Socket } from "socket.io-client";

interface Caption {
    type: "speech" | "sign";
    text: string;
    from?: string;
    timestamp: number;
}

export default function CallPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const router = useRouter();
    const { user, accessToken } = useAuth();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const recognitionRef = useRef<unknown>(null);
    const remotePeerSocketId = useRef<string | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [captions, setCaptions] = useState<Caption[]>([]);
    const [participantCount, setParticipantCount] = useState(1);
    const [callDuration, setCallDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const addCaption = useCallback((c: Caption) => {
        setCaptions((prev) => [...prev.slice(-4), c]);
    }, []);

    // Setup WebRTC peer connection
    const createPeerConnection = useCallback((socket: Socket) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });

        // Add local tracks
        localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));

        // Receive remote stream
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setIsConnected(true);
            }
        };

        // Send ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && remotePeerSocketId.current) {
                socket.emit("ice-candidate", { to: remotePeerSocketId.current, candidate: event.candidate });
            }
        };

        return pc;
    }, []);

    // Start speech recognition (hearing user's speech → caption for deaf user)
    const startSpeechRecognition = useCallback((socket: Socket) => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new (SpeechRecognition as new () => {
            continuous: boolean; interimResults: boolean; lang: string;
            onresult: (e: unknown) => void; onerror: () => void; start: () => void;
        })();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (e: unknown) => {
            const event = e as { results: { [key: number]: { [key: number]: { transcript: string }; isFinal: boolean } }; resultIndex: number };
            const result = event.results[event.resultIndex];
            const transcript = result[0].transcript;
            if (result.isFinal) {
                socket.emit("speech-caption", { roomId, text: transcript });
            }
        };

        recognition.onerror = () => { };
        recognition.start();
        recognitionRef.current = recognition;
    }, [roomId]);

    useEffect(() => {
        if (!user || !accessToken) { router.push("/login"); return; }

        const init = async () => {
            try {
                // Get user media
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Connect socket
                const socket = getSocket(accessToken);
                socketRef.current = socket;

                // Socket events
                socket.on("room-users", (users: { socketId: string }[]) => {
                    setParticipantCount(users.length);
                });

                socket.on("user-joined", async ({ socketId }: { socketId: string }) => {
                    remotePeerSocketId.current = socketId;
                    setParticipantCount((p) => p + 1);
                    toast.success("Someone joined the call!");

                    // Create offer
                    const pc = createPeerConnection(socket);
                    peerConnectionRef.current = pc;
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit("offer", { to: socketId, offer });
                });

                socket.on("offer", async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
                    remotePeerSocketId.current = from;
                    const pc = createPeerConnection(socket);
                    peerConnectionRef.current = pc;
                    await pc.setRemoteDescription(offer);
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit("answer", { to: from, answer });
                });

                socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
                    await peerConnectionRef.current?.setRemoteDescription(answer);
                });

                socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
                    try {
                        await peerConnectionRef.current?.addIceCandidate(candidate);
                    } catch { /* ignore */ }
                });

                socket.on("user-left", () => {
                    setIsConnected(false);
                    setParticipantCount((p) => Math.max(1, p - 1));
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    toast("Participant left the call.", { icon: "👋" });
                });

                socket.on("speech-caption", ({ text }: { text: string }) => {
                    addCaption({ type: "speech", text, timestamp: Date.now() });
                });

                socket.on("sign-caption", ({ text }: { text: string }) => {
                    if (text) addCaption({ type: "sign", text, timestamp: Date.now() });
                });

                // Join room
                socket.emit("join-room", { roomId });

                // Start speech recognition
                startSpeechRecognition(socket);

                setLoading(false);
            } catch (err) {
                toast.error("Could not access camera/microphone.");
                console.error(err);
                setLoading(false);
            }
        };

        init();

        // Call timer
        const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);

        return () => {
            clearInterval(timer);
            (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
            peerConnectionRef.current?.close();
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            disconnectSocket();
        };
    }, [user, accessToken, router, roomId, createPeerConnection, startSpeechRecognition, addCaption]);

    const toggleMute = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsMuted((m) => !m);
    };

    const toggleCam = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsCamOff((c) => !c);
    };

    const endCall = async () => {
        try { await api.patch(`/calls/${roomId}/end`); } catch { /* ignore */ }
        (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
        peerConnectionRef.current?.close();
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        disconnectSocket();
        router.push("/dashboard");
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Call link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    return (
        <div className="h-screen bg-[#0a0a1a] flex flex-col overflow-hidden">
            {/* Top bar */}
            <div className="glass border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
                        <Hand size={14} className="text-white" />
                    </div>
                    <span className="font-jakarta font-bold text-sm gradient-text">SignBridge</span>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-slate-400 text-xs font-mono">{formatTime(callDuration)}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full">
                        <Users size={13} className="text-violet-400" />
                        <span className="text-xs text-slate-300">{participantCount}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 glass px-3 py-1.5 rounded-full ${isConnected ? "border-emerald-700/30" : ""}`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                        <span className="text-xs text-slate-300">{isConnected ? "Connected" : "Waiting..."}</span>
                    </div>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/8 transition-all"
                    >
                        {copied ? <Copy size={13} className="text-teal-400" /> : <Link2 size={13} />}
                        {copied ? "Copied!" : "Share"}
                    </button>
                </div>
            </div>

            {/* Video area */}
            <div className="flex-1 relative overflow-hidden p-3">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <Loader2 size={36} className="text-violet-400 animate-spin" />
                        <p className="text-slate-400">Starting camera...</p>
                    </div>
                ) : (
                    <div className={`video-grid h-full ${isConnected ? "two" : "one"}`}>
                        {/* Remote video or waiting state */}
                        {isConnected ? (
                            <div className="relative rounded-2xl overflow-hidden bg-[#0f0f23] border border-white/5">
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute bottom-3 left-3 glass px-3 py-1 rounded-full text-xs text-slate-300">
                                    Remote User
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-violet-900/20 to-purple-950/40 border border-violet-800/20 flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-full glass-purple flex items-center justify-center mb-4 float">
                                    <Users size={32} className="text-violet-400" />
                                </div>
                                <p className="text-slate-300 font-medium mb-2">Waiting for others to join...</p>
                                <p className="text-slate-500 text-sm mb-4">Share the link to invite</p>
                                <button
                                    onClick={copyLink}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass-purple text-violet-300 text-sm font-medium hover:bg-violet-600/20 transition-all"
                                >
                                    <Link2 size={16} />
                                    Copy Invite Link
                                </button>
                            </div>
                        )}

                        {/* Local video */}
                        <div className={`relative rounded-2xl overflow-hidden bg-[#0f0f23] border border-white/5 ${isConnected ? "" : "absolute bottom-4 right-4 w-48 h-32 rounded-xl"}`}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={isCamOff ? { display: "none" } : {}}
                            />
                            {isCamOff && (
                                <div className="absolute inset-0 bg-[#0f0f23] flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-lg font-bold">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-1.5 left-1.5 glass px-2 py-0.5 rounded-full text-xs text-slate-300">
                                You {isMuted && "· Muted"}
                            </div>
                        </div>
                    </div>
                )}

                {/* Captions overlay */}
                {captions.length > 0 && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-full px-4 space-y-2 pointer-events-none">
                        {captions.slice(-2).map((c, i) => (
                            <div
                                key={c.timestamp + i}
                                className={`glass rounded-xl px-4 py-2 flex items-start gap-2 ${c.type === "sign" ? "border-violet-700/40" : "border-teal-700/40"
                                    }`}
                            >
                                {c.type === "sign" ? (
                                    <Hand size={14} className="text-violet-400 shrink-0 mt-0.5" />
                                ) : (
                                    <MessageSquare size={14} className="text-teal-400 shrink-0 mt-0.5" />
                                )}
                                <span className="text-sm text-white">
                                    <span className={`font-medium text-xs mr-1.5 ${c.type === "sign" ? "text-violet-400" : "text-teal-400"}`}>
                                        {c.type === "sign" ? "Sign:" : "Speech:"}
                                    </span>
                                    {c.text}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="glass border-t border-white/5 px-6 py-4 flex items-center justify-center gap-4 shrink-0">
                <button
                    onClick={toggleMute}
                    id="toggle-mute"
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-600 hover:bg-red-700" : "glass hover:bg-white/10"
                        }`}
                >
                    {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-slate-300" />}
                </button>

                <button
                    onClick={toggleCam}
                    id="toggle-cam"
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCamOff ? "bg-red-600 hover:bg-red-700" : "glass hover:bg-white/10"
                        }`}
                >
                    {isCamOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-slate-300" />}
                </button>

                <button
                    onClick={endCall}
                    id="end-call"
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
                >
                    <PhoneOff size={24} className="text-white" />
                </button>

                <button
                    onClick={copyLink}
                    className="w-12 h-12 rounded-full glass hover:bg-white/10 flex items-center justify-center transition-all"
                >
                    <Copy size={20} className="text-slate-300" />
                </button>
            </div>
        </div>
    );
}
