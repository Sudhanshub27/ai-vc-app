"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Phone, Clock, Video, ArrowLeft, Loader2, Hand, ArrowRight, LogOut, User } from "lucide-react";

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
    const { user, logout, isLoading } = useAuth();
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
        if (isLoading) return;
        if (!user) { router.push("/login"); return; }
        fetchCalls(page);
    }, [user, router, page, isLoading]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#fbf9f5] flex text-[#1b1c1a]">
            {/* Sidebar */}
            <aside className="w-64 bg-[#f5f3ef] border-r border-[#dbdad6] flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-[#dbdad6]">
                    <Link href="/" className="flex items-center gap-2">
                        <Hand size={18} className="text-[#9a442d]" />
                        <span className="font-serif font-semibold text-xl text-[#1b1c1a]">SignBridge</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1 mt-4">
                    {[
                        { href: "/dashboard", icon: Video, label: "Dashboard" },
                        { href: "/history", icon: Clock, label: "Call History", active: true },
                        { href: "/profile", icon: User, label: "My Profile" },
                    ].map(({ href, icon: Icon, label, active }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-body transition-all ${active
                                ? "text-[#9a442d] bg-[#ffdbd2]/30 border-l-2 border-[#9a442d] font-semibold"
                                : "text-[#55423e] hover:text-[#1b1c1a] hover:bg-[#eae8e4]"
                                }`}
                        >
                            <Icon size={18} className={active ? "text-[#9a442d]" : "group-hover:text-[#9a442d]"} />
                            <span>{label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#dbdad6]">
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#eae8e4] mb-2 border border-[#dbdad6]">
                        <div className="w-8 h-8 rounded-full bg-[#9a442d] flex items-center justify-center text-sm font-serif text-white shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1b1c1a] truncate font-body">{user.name}</p>
                            <p className="text-[10px] text-[#88726d] capitalize font-label tracking-wide">{user.role} user</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => { await logout(); router.push("/"); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-[#55423e] hover:text-[#ba1a1a] hover:bg-[#ffdbd2]/50 transition-all font-body text-sm rounded-none border border-transparent hover:border-[#ba1a1a]/20"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="ml-64 flex-1 p-10 md:p-14">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#88726d] hover:text-[#9a442d] text-sm mb-6 transition-colors font-body">
                    <ArrowLeft size={16} />Back to Dashboard
                </Link>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <p className="font-label text-xs text-[#9a442d] mb-2 tracking-[0.1em]">Activity</p>
                        <h1 className="font-serif text-4xl text-[#1b1c1a]">Call History</h1>
                    </div>
                    <Link href="/dashboard" className="btn-primary flex items-center gap-2">
                        <Phone size={16} /> New Call
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-[#f5f3ef] animate-pulse" />)}
                    </div>
                ) : calls.length === 0 ? (
                    <div className="text-center py-16 bg-[#f5f3ef] border border-[#dbdad6]">
                        <Video size={30} className="text-[#88726d] mx-auto mb-4 opacity-50" />
                        <p className="font-serif text-lg text-[#55423e] mb-2">No calls yet.</p>
                        <p className="font-body text-sm text-[#88726d] mb-6">Your calls will appear here once you start one.</p>
                        <Link href="/dashboard" className="btn-primary">
                            Start Your First Call
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {calls.map((c) => (
                                <div key={c._id} className="bg-[#ffffff] border border-[#dbdad6] p-5 flex items-center gap-4 hover:border-[#9a442d]/30 transition-all tuscan-shadow">
                                    <div className="w-12 h-12 bg-[#9a442d] flex items-center justify-center text-lg font-serif text-white shrink-0">
                                        {c.initiator?.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-body font-semibold text-[#1b1c1a]">{c.initiator?.name || "Unknown"}</p>
                                        <p className="text-sm text-[#55423e] font-body">{formatDate(c.createdAt)}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-[#88726d] font-body">
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} /> {formatDuration(c.duration)}
                                            </span>
                                            <span>· {c.participants?.length ?? 1} participant{(c.participants?.length ?? 1) !== 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`font-label text-[10px] tracking-widest px-3 py-1 border ${c.status === "ended" ? "bg-[#f5f3ef] text-[#55423e] border-[#dbdad6]" :
                                            c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                "bg-[#ffdbd2] text-[#9a442d] border-[#e07a5f]"
                                            }`}>
                                            {c.status}
                                        </span>
                                        {c.status !== "ended" && (
                                            <Link href={`/call/${c.roomId}`} className="text-xs text-[#9a442d] hover:text-[#e07a5f] flex items-center gap-1 transition-colors font-body underline underline-offset-4">
                                                Rejoin <ArrowRight size={12} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-10">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                    className="px-5 py-2.5 border border-[#dbdad6] text-sm text-[#55423e] hover:border-[#9a442d] hover:text-[#9a442d] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-body">
                                    Previous
                                </button>
                                <span className="text-sm text-[#88726d] font-body">Page {page} of {totalPages}</span>
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="px-5 py-2.5 border border-[#dbdad6] text-sm text-[#55423e] hover:border-[#9a442d] hover:text-[#9a442d] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-body">
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
