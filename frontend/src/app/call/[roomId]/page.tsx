"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSocket, disconnectSocket } from "@/lib/socket";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Copy,
    MessageSquare, Hand, Users, Loader2, Link2, Wand2, X
} from "lucide-react";
import type { Socket } from "socket.io-client";

interface Caption {
    type: "speech" | "sign";
    text: string;
    from?: string;
    timestamp: number;
    isFramed?: boolean;
}

export default function CallPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const router = useRouter();
    const { user, accessToken, isLoading } = useAuth();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const aiCanvasRef = useRef<HTMLCanvasElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const recognitionRef = useRef<unknown>(null);
    const remotePeerSocketId = useRef<string | null>(null);
    const pendingCandidates = useRef<RTCIceCandidate[]>([]);
    const isInitiator = useRef(false);
    const isInitializing = useRef(false);
    const handsRef = useRef<any>(null);
    const landmarksRef = useRef<any[]>([]);
    const onResultsRef = useRef<((results: any) => void) | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [captions, setCaptions] = useState<Caption[]>([]);
    const [participantCount, setParticipantCount] = useState(1);
    const [callDuration, setCallDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [wordBuffer, setWordBuffer] = useState<string[]>([]);
    const [candidateSign, setCandidateSign] = useState<string | null>(null);

    useEffect(() => {
        if (wordBuffer.length > 0) {
            console.log("📝 Word Buffer Sync:", wordBuffer);
        }
    }, [wordBuffer]);

    const clearBuffer = () => {
        setWordBuffer([]);
    };

    const addCaption = useCallback((c: Caption) => {
        setCaptions((prev) => [...prev, c]);
        // Auto-remove after 0.5s as requested
        setTimeout(() => {
            setCaptions((prev) => prev.filter((cap) => cap.timestamp !== c.timestamp));
        }, 500);
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
        if (localStreamRef.current) {
            console.log("WebRTC: Adding local tracks to PC");
            localStreamRef.current.getTracks().forEach((t) => {
                pc.addTrack(t, localStreamRef.current!);
            });
        }

        // Receive remote stream
        pc.ontrack = (event) => {
            console.log("WebRTC: Received remote track", event.streams[0]);
            if (event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("WebRTC: ICE connection state:", pc.iceConnectionState);
            if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                setIsConnected(true);
            }
        };

        // Send ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && remotePeerSocketId.current) {
                console.log("WebRTC: Sending ICE candidate to", remotePeerSocketId.current);
                socket.emit("ice-candidate", { to: remotePeerSocketId.current, candidate: event.candidate });
            }
        };

        // Handle negotiation (when tracks are added)
        pc.onnegotiationneeded = async () => {
            console.log("WebRTC: Negotiation needed. Is initiator?", isInitiator.current);
            if (isInitiator.current && remotePeerSocketId.current) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    console.log("WebRTC: Sending offer to", remotePeerSocketId.current);
                    socket.emit("offer", { to: remotePeerSocketId.current, offer });
                } catch (e) {
                    console.error("WebRTC: Negotiation error:", e);
                }
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

    const drawHandLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
        // Hand points connections (simplified skeleton)
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [5, 9], [9, 10], [10, 11], [11, 12], // Middle
            [9, 13], [13, 14], [14, 15], [15, 16], // Ring
            [13, 17], [17, 18], [18, 19], [19, 20], [0, 17] // Pinky
        ];

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#e07a5f'; // Coral accent
        ctx.fillStyle = '#e07a5f';

        landmarks.forEach((hand) => {
            // Draw skeleton
            connections.forEach(([i, j]) => {
                const pt1 = hand[i];
                const pt2 = hand[j];
                ctx.beginPath();
                ctx.moveTo(pt1[0] * ctx.canvas.width, pt1[1] * ctx.canvas.height);
                ctx.lineTo(pt2[0] * ctx.canvas.width, pt2[1] * ctx.canvas.height);
                ctx.stroke();
            });

            // Draw points
            hand.forEach((pt: any) => {
                ctx.beginPath();
                ctx.arc(pt[0] * ctx.canvas.width, pt[1] * ctx.canvas.height, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        });
    };

    // Handle landmark results - Store in Ref to avoid stale closure issues
    onResultsRef.current = (results: any) => {
        if (results.multiHandLandmarks) {
            landmarksRef.current = results.multiHandLandmarks;
        } else {
            landmarksRef.current = [];
        }

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const data = results.multiHandLandmarks.map((hand: any) =>
                hand.map((lm: any) => [lm.x, lm.y, lm.z])
            );
            if (socketRef.current) {
                socketRef.current.emit("hand-landmarks", { roomId, landmarks: data });
            }
        }
    };

    useEffect(() => {
        if (isLoading) return;
        if (!user || !accessToken) { router.push("/login"); return; }
        if (isInitializing.current) return;
        isInitializing.current = true;

        const init = async () => {
            try {
                console.log("CallPage: Initializing...");
                // Get user media
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                setLocalStream(stream);

                // MediaPipe Hands Initialization (Dynamic Load)
                let HandsModule: any = (window as any).Hands;
                
                // Wait for script to load if it's not ready yet
                if (!HandsModule) {
                    console.log("MediaPipe: Waiting for Hands script to load...");
                    for (let i = 0; i < 10; i++) {
                        await new Promise(r => setTimeout(r, 500));
                        HandsModule = (window as any).Hands;
                        if (HandsModule) break;
                    }
                }

                if (HandsModule) {
                    console.log("MediaPipe: Initializing Hands module...");
                    const hands = new HandsModule({
                        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
                    });
                    hands.setOptions({
                        maxNumHands: 2,
                        modelComplexity: 1,
                        minDetectionConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    });
                    // Always call the latest Ref version to avoid closure staleness
                    hands.onResults((results: any) => {
                        if (onResultsRef.current) onResultsRef.current(results);
                    });
                    handsRef.current = hands;

                    // Set up processing loop
                    const processVideo = async () => {
                        if (!isInitializing.current) return;
                        
                        const videoEl = localVideoRef.current;
                        const canvas = aiCanvasRef.current;
                        
                        // DRAWING LOGIC (Always run if possible)
                        if (canvas && videoEl && videoEl.readyState >= 2) {
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

                                // Overlay landmarks from Ref
                                if (landmarksRef.current && landmarksRef.current.length > 0) {
                                    drawHandLandmarks(ctx, landmarksRef.current.map((h: any) => h.map((l: any) => [l.x, l.y, l.z])));
                                }

                                // Overlay candidate sign
                                if (candidateSign) {
                                    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                                    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
                                    ctx.fillStyle = "#e07a5f";
                                    ctx.font = "bold 14px Inter, sans-serif";
                                    ctx.textAlign = "center";
                                    ctx.fillText(candidateSign.toUpperCase(), canvas.width / 2, canvas.height - 10);
                                }
                            }
                        }

                        // MEDIA PIPE PROCESSING
                        try {
                            if (handsRef.current && videoEl && videoEl.readyState >= 2) {
                                await handsRef.current.send({ image: videoEl });
                            }
                        } catch (e) {
                            console.error("MediaPipe: Processing loop error", e);
                        }
                        
                        if (isInitializing.current) requestAnimationFrame(processVideo);
                    };
                    if (isInitializing.current) requestAnimationFrame(processVideo);
                }

                // Connect socket
                const socket = getSocket(accessToken);
                socketRef.current = socket;

                socket.on("connect", () => {
                    console.log("🔌 Socket connected successfully:", socket.id);
                });

                socket.on("connect_error", (err) => {
                    console.error("🔌 Socket connection error:", err.message);
                    toast.error("Live translation connection failed.");
                });

                // Socket events
                socket.on("room-users", (users: { socketId: string }[]) => {
                    setParticipantCount(Math.max(1, users.length));
                });

                socket.on("user-joined", async ({ socketId }: { socketId: string }) => {
                    console.log("WebRTC: User joined", socketId);
                    remotePeerSocketId.current = socketId;
                    isInitiator.current = true; 
                    setParticipantCount((p) => p + 1);
                    toast.success("Someone joined the call!");

                    if (!peerConnectionRef.current) {
                        peerConnectionRef.current = createPeerConnection(socket);
                    }
                });

                socket.on("offer", async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
                    console.log("WebRTC: Received offer from", from);
                    remotePeerSocketId.current = from;
                    isInitiator.current = false;
                    setParticipantCount(2);
                    
                    if (!peerConnectionRef.current) {
                        peerConnectionRef.current = createPeerConnection(socket);
                    }
                    
                    try {
                        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                        const answer = await peerConnectionRef.current.createAnswer();
                        await peerConnectionRef.current.setLocalDescription(answer);
                        console.log("WebRTC: Sending answer to", from);
                        socket.emit("answer", { to: from, answer });

                        console.log(`WebRTC: Processing ${pendingCandidates.current.length} pending ICE candidates`);
                        pendingCandidates.current.forEach(async (c: RTCIceCandidate) => {
                            try { await peerConnectionRef.current?.addIceCandidate(c); } catch (e) { console.error(e); }
                        });
                        pendingCandidates.current = [];
                    } catch (e) {
                        console.error("WebRTC: Error handling offer:", e);
                    }
                });

                socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
                    console.log("WebRTC: Received answer");
                    if (peerConnectionRef.current) {
                        try {
                            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));

                            console.log(`WebRTC: Processing ${pendingCandidates.current.length} pending ICE candidates (after answer)`);
                            pendingCandidates.current.forEach(async (c: RTCIceCandidate) => {
                                try { await peerConnectionRef.current?.addIceCandidate(c); } catch (e) { console.error(e); }
                            });
                            pendingCandidates.current = [];
                        } catch (e) {
                            console.error("WebRTC: Error setting remote description:", e);
                        }
                    }
                });

                socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
                    if (peerConnectionRef.current) {
                        try {
                            const rtcCandidate = new RTCIceCandidate(candidate);
                            if (peerConnectionRef.current.remoteDescription) {
                                console.log("WebRTC: Adding ICE candidate immediately");
                                await peerConnectionRef.current.addIceCandidate(rtcCandidate);
                            } else {
                                console.log("WebRTC: Queuing ICE candidate");
                                pendingCandidates.current.push(rtcCandidate);
                            }
                        } catch (e) {
                            console.error("WebRTC: Error adding ICE candidate:", e);
                        }
                    }
                });

                socket.on("user-left", () => {
                    console.log("WebRTC: User left");
                    setIsConnected(false);
                    setParticipantCount(1);
                    isInitiator.current = false;
                    setRemoteStream(null);
                    if (peerConnectionRef.current) {
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                    }
                    pendingCandidates.current = [];
                    toast("Participant left the call.", { icon: "👋" });
                });

                socket.on("speech-caption", ({ text }: { text: string }) => {
                    addCaption({ type: "speech", text, timestamp: Date.now() });
                });

                socket.on("sign-caption", ({ text, isFramed, buffer, from, isThinking }: { text: string; isFramed?: boolean; buffer?: string[]; from?: string; isThinking?: boolean }) => {
                    const isMe = from === user?.id;
                    
                    // Update word buffer for the user who is signing
                    if (isMe && buffer) setWordBuffer(buffer);
                    if (isFramed && isMe) {
                        setWordBuffer([]);
                        setCandidateSign(null);
                    }
                    
                    // Update live candidate for better feedback
                    if (isMe) {
                        if (isThinking) setCandidateSign(text);
                        else setCandidateSign(null);
                    }
                    
                    // Only add to the floating captions overlay if it's an AI-framed sentence
                    // and not a "thinking" sign or individual word confirmation
                    if (text && isFramed) {
                        addCaption({ type: "sign", text, isFramed, timestamp: Date.now() });
                    }
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
                isInitializing.current = false;
            }
        };

        init();

        // Call timer
        const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);

        return () => {
            console.log("CallPage: Cleaning up...");
            clearInterval(timer);
            (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
            peerConnectionRef.current?.close();
            peerConnectionRef.current = null;
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            
            if (socketRef.current) {
                socketRef.current.off("room-users");
                socketRef.current.off("user-joined");
                socketRef.current.off("offer");
                socketRef.current.off("answer");
                socketRef.current.off("ice-candidate");
                socketRef.current.off("user-left");
                socketRef.current.off("speech-caption");
                socketRef.current.off("sign-caption");
            }
            disconnectSocket();
            isInitializing.current = false;
            if (handsRef.current) {
                handsRef.current.close();
            }
        };
    }, [user, accessToken, router, roomId, createPeerConnection, startSpeechRecognition, addCaption, isLoading]);

    const toggleMute = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsMuted((m) => !m);
    };

    const toggleCam = () => {
        if (!localStream) return;
        localStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsCamOff((c) => !c);
    };

    const endCall = async () => {
        try { await api.patch(`/calls/${roomId}/end`); } catch { /* ignore */ }
        (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
        peerConnectionRef.current?.close();
        localStream?.getTracks().forEach((t) => t.stop());
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
        <div className="h-screen bg-[#1b1c1a] flex flex-col overflow-hidden">
            {/* Top bar */}
            <div className="bg-[#2a2b29] border-b border-[#3a3b39] px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Hand size={18} className="text-[#e07a5f]" />
                    <span className="font-serif font-semibold text-sm text-[#f5f3ef]">SignBridge</span>
                    <span className="text-[#55423e] text-xs">·</span>
                    <span className="text-[#88726d] text-xs font-mono">{formatTime(callDuration)}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-[#3a3b39] px-3 py-1.5 border border-[#55423e]/30">
                        <Users size={13} className="text-[#e07a5f]" />
                        <span className="text-xs text-[#dbc1ba]">{participantCount}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 bg-[#3a3b39] px-3 py-1.5 border ${isConnected ? "border-emerald-700/30" : "border-[#55423e]/30"}`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                        <span className="text-xs text-[#dbc1ba]">{isConnected ? "Connected" : "Waiting..."}</span>
                    </div>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-1.5 bg-[#3a3b39] px-3 py-1.5 border border-[#55423e]/30 text-xs text-[#dbc1ba] hover:text-white hover:border-[#9a442d] transition-all"
                    >
                        {copied ? <Copy size={13} className="text-[#e07a5f]" /> : <Link2 size={13} />}
                        {copied ? "Copied!" : "Share"}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden p-6 flex items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 size={36} className="text-[#e07a5f] animate-spin" />
                        <p className="text-[#88726d] font-body">Initializing your session...</p>
                    </div>
                ) : (
                    <>
                        {/* Video Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-w-7xl mx-auto items-center">
                            {/* Remote User */}
                            <div className="relative group w-full aspect-video overflow-hidden bg-[#2a2b29] border border-[#3a3b39]">
                                {remoteStream ? (
                                    <video
                                        ref={(el) => {
                                            if (el) el.srcObject = remoteStream;
                                            (remoteVideoRef as any).current = el;
                                        }}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover mirror"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#2a2b29]">
                                        <div className="w-20 h-20 bg-[#55423e] flex items-center justify-center mb-4">
                                            <Users size={32} className="text-[#88726d]" />
                                        </div>
                                        <span className="text-[#88726d] text-sm font-body">
                                            {participantCount > 1 ? "Connecting to peer..." : "Waiting for participant..."}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#1b1c1a]/80 px-3 py-1.5 border border-[#3a3b39]" style={{ backdropFilter: 'blur(4px)' }}>
                                    <span className={`w-2 h-2 rounded-full ${remoteStream ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                                    <span className="text-xs text-[#f5f3ef] font-body font-semibold">Remote User</span>
                                </div>
                            </div>

                            {/* Local User */}
                            <div className="relative group w-full aspect-video overflow-hidden bg-[#2a2b29] border border-[#3a3b39]">
                                <video
                                    ref={(el) => {
                                        if (el) el.srcObject = localStream;
                                        (localVideoRef as any).current = el;
                                    }}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover mirror ${isCamOff ? "hidden" : ""}`}
                                />
                                {isCamOff && (
                                    <div className="w-full h-full flex items-center justify-center bg-[#2a2b29]">
                                        <div className="w-24 h-24 rounded-full bg-[#9a442d] flex items-center justify-center text-3xl font-serif text-white">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#1b1c1a]/80 px-3 py-1.5 border border-[#3a3b39]" style={{ backdropFilter: 'blur(4px)' }}>
                                    <span className="w-2 h-2 rounded-full bg-[#e07a5f]" />
                                    <span className="text-xs text-[#f5f3ef] font-body font-semibold">You {isMuted && "(Muted)"}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Vision PIP Overlay */}
                        <div className="absolute bottom-10 right-10 w-64 aspect-video overflow-hidden bg-[#2a2b29] border border-[#e07a5f]/40 shadow-2xl group hover:scale-105 transition-all z-20 pointer-events-auto">
                            <canvas
                                ref={aiCanvasRef}
                                width={240}
                                height={180}
                                className="w-full h-full object-cover mirror"
                            />
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#1b1c1a]/70 px-2 py-1 border border-[#e07a5f]/30" style={{ backdropFilter: 'blur(4px)' }}>
                                <Loader2 size={10} className="text-[#e07a5f] animate-spin" />
                                <span className="text-[10px] text-[#e07a5f] font-label tracking-widest">AI VISION</span>
                            </div>
                        </div>

                        {/* Word Buffer Section */}
                        {(wordBuffer.length > 0 || candidateSign) && (
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 max-w-xl w-full px-4 z-30 pointer-events-auto">
                                <div className="bg-[#2a2b29]/95 border border-[#3a3b39] p-4 flex flex-wrap gap-2 items-center" style={{ backdropFilter: 'blur(8px)' }}>
                                    <div className="flex justify-between items-center w-full mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-label tracking-widest text-[#88726d]">Detected Words:</span>
                                            <span className="text-[10px] text-[#e07a5f] animate-pulse font-body">Hold sign for 0.3s to confirm</span>
                                        </div>
                                        <button 
                                            onClick={clearBuffer}
                                            className="text-[10px] text-[#88726d] hover:text-white transition-colors flex items-center gap-1 font-body"
                                        >
                                            <X size={10} /> Clear
                                        </button>
                                    </div>
                                    {wordBuffer.map((word, idx) => (
                                        <span key={idx} className="bg-[#9a442d]/20 text-[#ffdbd2] px-2 py-1 text-sm border border-[#9a442d]/30 font-body">
                                            {word}
                                        </span>
                                    ))}
                                    {candidateSign && (
                                        <span className="bg-[#e07a5f]/10 text-[#e07a5f] px-2 py-1 text-sm border border-[#e07a5f]/20 italic opacity-70 animate-pulse font-body">
                                            {candidateSign}...
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Captions overlay */}
                        {captions.length > 0 && (
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-xl w-full px-4 space-y-2 pointer-events-none z-30">
                                {captions.map((c, i) => (
                                    <div
                                        key={c.timestamp + i}
                                        className={`bg-[#2a2b29]/95 px-4 py-3 flex items-start gap-3 border animate-fade-up ${
                                            c.type === "sign" ? "border-[#9a442d]/40" : "border-[#e07a5f]/40"
                                        }`}
                                        style={{ backdropFilter: 'blur(8px)' }}
                                    >
                                        {c.type === "sign" ? (
                                            <Hand size={16} className="text-[#9a442d] shrink-0 mt-0.5" />
                                        ) : (
                                            <MessageSquare size={16} className="text-[#e07a5f] shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-label tracking-widest mb-0.5 ${
                                                c.type === "sign" ? "text-[#9a442d]" : "text-[#e07a5f]"
                                            }`}>
                                                {c.type === "sign" ? (c.isFramed ? "AI Sentence" : "Sign") : "Speech"}
                                            </span>
                                            <span className="text-sm text-[#f5f3ef] font-body leading-relaxed">{c.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="bg-[#2a2b29] border-t border-[#3a3b39] px-8 py-5 flex items-center justify-center gap-5 shrink-0 relative z-40">
                <button
                    onClick={toggleMute}
                    className={`group w-12 h-12 flex items-center justify-center transition-all border ${
                        isMuted ? "bg-[#ba1a1a] border-[#ba1a1a] shadow-lg shadow-red-900/20" : "bg-[#3a3b39] border-[#55423e]/30 hover:border-[#88726d]"
                    }`}
                >
                    {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="group-hover:text-white text-[#88726d]" />}
                </button>

                <button
                    onClick={toggleCam}
                    className={`group w-12 h-12 flex items-center justify-center transition-all border ${
                        isCamOff ? "bg-[#ba1a1a] border-[#ba1a1a] shadow-lg shadow-red-900/20" : "bg-[#3a3b39] border-[#55423e]/30 hover:border-[#88726d]"
                    }`}
                >
                    {isCamOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="group-hover:text-white text-[#88726d]" />}
                </button>

                <button
                    onClick={endCall}
                    className="w-14 h-14 bg-[#ba1a1a] hover:bg-red-700 flex items-center justify-center transition-all shadow-xl shadow-red-900/40 hover:scale-105 active:scale-95"
                >
                    <PhoneOff size={24} className="text-white" />
                </button>

                <div className="h-8 w-[1px] bg-[#3a3b39] mx-2" />

                <button
                    onClick={() => {
                        if (socketRef.current && wordBuffer.length > 0) {
                            socketRef.current.emit("frame-buffer", { roomId });
                        }
                    }}
                    disabled={wordBuffer.length === 0}
                    className={`h-12 px-6 flex items-center gap-2 transition-all border ${
                        wordBuffer.length > 0 
                        ? "bg-[#9a442d] border-[#9a442d] text-white shadow-xl shadow-[#9a442d]/20 hover:bg-[#7c2e19] hover:scale-105 active:scale-95" 
                        : "bg-[#3a3b39] border-[#55423e]/30 text-[#55423e] opacity-40 cursor-not-allowed"
                    }`}
                >
                    <Wand2 size={18} className={wordBuffer.length > 0 ? "animate-pulse" : ""} />
                    <span className="text-sm font-label tracking-wider">AI Frame</span>
                </button>
            </div>
        </div>
    );
}
