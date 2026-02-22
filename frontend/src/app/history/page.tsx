"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Phone, Clock, Video, ArrowLeft, Loader2, Hand, ArrowRight } from "lucide-react";

interface CallRecord {
    _id: string;
    roomId: string;
    status: "waiting" | "active" | "ended";
    duration: number;
    createdAt: string;
    initiator: { name: string; email: string; avatar?: string };
    participants: { user: { name: string; email: string } }[];
}

function formatDuration(secs: number) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function HistoryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCalls = async (p: number) => {
        setLoading(true);
        try {
            const r = await api.get(`/calls/history?page=${p}&limit=10`);
            setCalls(r.data.data.calls);
            setTotalPages(r.data.data.pagination.pages);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        fetchCalls(page);
    }, [user, router, page]);

    return (
        <div className="min-h-screen bg-[#0a0a1a] flex">
            <aside className="w-64 glass border-r border-white/5 flex flex-col fixed h-full">
                <div className="p-6 border-b border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
                            <Hand size={16} className="text-white" />
                        </div>
                        <span className="font-jakarta font-bold text-lg gradient-text">SignBridge</span>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { href: "/dashboard", label: "Dashboard" },
                        { href: "/history", label: "Call History", active: true },
                        { href: "/profile", label: "My Profile" },
                    ].map(({ href, label, active }) => (
                        <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-300" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                            {label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className="ml-64 flex-1 p-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                    <ArrowLeft size={16} />Back to Dashboard
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-jakarta font-bold text-3xl text-white flex items-center gap-2">
                        <Clock size={24} className="text-teal-400" />
                        Call History
                    </h1>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/30 text-violet-300 text-sm font-medium hover:bg-violet-600/50 transition-colors">
                        <Phone size={16} />New Call
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
                    </div>
                ) : calls.length === 0 ? (
                    <div className="text-center py-20 glass rounded-2xl">
                        <Video size={40} className="text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg mb-2">No calls yet</p>
                        <p className="text-slate-500 text-sm mb-6">Your calls will appear here once you start one.</p>
                        <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-violet-600/30 text-violet-300 text-sm font-medium hover:bg-violet-600/50 transition-colors">
                            Start Your First Call
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {calls.map((c) => (
                                <div key={c._id} className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/5 transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-lg font-bold shrink-0">
                                        {c.initiator?.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white">{c.initiator?.name || "Unknown"}</p>
                                        <p className="text-sm text-slate-400">{formatDate(c.createdAt)}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} /> {formatDuration(c.duration)}
                                            </span>
                                            <span>· {c.participants?.length ?? 1} participant{(c.participants?.length ?? 1) !== 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === "ended" ? "bg-slate-700 text-slate-400" :
                                                c.status === "active" ? "bg-emerald-900/50 text-emerald-400" :
                                                    "bg-amber-900/50 text-amber-400"
                                            }`}>
                                            {c.status}
                                        </span>
                                        {c.status !== "ended" && (
                                            <Link href={`/call/${c.roomId}`} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                                                Rejoin <ArrowRight size={12} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-8">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                    className="px-4 py-2 rounded-xl glass text-sm text-slate-300 hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                    Previous
                                </button>
                                <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="px-4 py-2 rounded-xl glass text-sm text-slate-300 hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
