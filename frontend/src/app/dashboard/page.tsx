"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    Video, Phone, Clock, Search, LogOut, User,
    Plus, ChevronRight, Hand, Loader2, Wifi
} from "lucide-react";

interface CallRecord {
    _id: string;
    roomId: string;
    status: string;
    duration: number;
    createdAt: string;
    initiator: { name: string; email: string; avatar?: string };
}

interface UserResult {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    isOnline: boolean;
}

function formatDuration(secs: number) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [loadingCalls, setLoadingCalls] = useState(true);
    const [searchQ, setSearchQ] = useState("");
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        api.get("/calls/history?limit=5")
            .then((r) => setCalls(r.data.data.calls))
            .catch(() => { })
            .finally(() => setLoadingCalls(false));
    }, [user, router]);

    useEffect(() => {
        if (searchQ.trim().length < 2) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const r = await api.get(`/users/search?q=${encodeURIComponent(searchQ)}`);
                setSearchResults(r.data.data.users);
            } catch { setSearchResults([]); }
            finally { setSearching(false); }
        }, 400);
        return () => clearTimeout(t);
    }, [searchQ]);

    const startCall = async () => {
        setStarting(true);
        try {
            const r = await api.post("/calls/create");
            const { roomId } = r.data.data.call;
            router.push(`/call/${roomId}`);
        } catch {
            toast.error("Failed to create call. Please try again.");
        } finally {
            setStarting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0a0a1a] flex">
            {/* Sidebar */}
            <aside className="w-64 glass border-r border-white/5 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
                            <Hand size={16} className="text-white" />
                        </div>
                        <span className="font-jakarta font-bold text-lg gradient-text">SignBridge</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { href: "/dashboard", icon: Video, label: "Dashboard" },
                        { href: "/history", icon: Clock, label: "Call History" },
                        { href: "/profile", icon: User, label: "My Profile" },
                    ].map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                        >
                            <Icon size={18} className="group-hover:text-violet-400 transition-colors" />
                            <span className="text-sm font-medium">{label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-purple mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-sm font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{user.role} user</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => { await logout(); router.push("/"); }}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/10 transition-all text-sm"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="ml-64 flex-1 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-jakarta font-bold text-3xl text-white mb-1">
                        Good day, {user.name.split(" ")[0]} 👋
                    </h1>
                    <p className="text-slate-400 text-sm">Ready to connect with the world?</p>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={startCall}
                        disabled={starting}
                        id="start-call-btn"
                        className="group glass rounded-2xl p-6 text-left hover:bg-white/6 transition-all border border-violet-800/20 hover:border-violet-600/40"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {starting ? <Loader2 size={22} className="text-white animate-spin" /> : <Plus size={22} className="text-white" />}
                        </div>
                        <h3 className="font-jakarta font-semibold text-white mb-1">Start a Call</h3>
                        <p className="text-slate-400 text-sm">Create a new video call room</p>
                    </button>

                    <Link
                        href="/history"
                        className="group glass rounded-2xl p-6 hover:bg-white/6 transition-all border border-teal-800/20 hover:border-teal-600/40"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Clock size={22} className="text-white" />
                        </div>
                        <h3 className="font-jakarta font-semibold text-white mb-1">Call History</h3>
                        <p className="text-slate-400 text-sm">View your past calls</p>
                    </Link>

                    <Link
                        href="/profile"
                        className="group glass rounded-2xl p-6 hover:bg-white/6 transition-all border border-blue-800/20 hover:border-blue-600/40"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <User size={22} className="text-white" />
                        </div>
                        <h3 className="font-jakarta font-semibold text-white mb-1">My Profile</h3>
                        <p className="text-slate-400 text-sm">Update your settings</p>
                    </Link>
                </div>

                {/* Search users */}
                <div className="glass rounded-2xl p-6 mb-6">
                    <h2 className="font-jakarta font-semibold text-white mb-4 flex items-center gap-2">
                        <Search size={18} className="text-violet-400" />
                        Find Users
                    </h2>
                    <div className="relative">
                        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                        {searching && <Loader2 size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {searchResults.map((u) => (
                                <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-sm font-bold shrink-0">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{u.name}</p>
                                        <p className="text-xs text-slate-400">{u.email} · {u.role}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {u.isOnline && <Wifi size={12} className="text-emerald-400" />}
                                        <button
                                            onClick={startCall}
                                            className="px-3 py-1.5 rounded-lg bg-violet-600/30 text-violet-300 text-xs font-medium hover:bg-violet-600/50 transition-colors"
                                        >
                                            Call
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Calls */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-jakarta font-semibold text-white flex items-center gap-2">
                            <Phone size={18} className="text-teal-400" />
                            Recent Calls
                        </h2>
                        <Link
                            href="/history"
                            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                        >
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>

                    {loadingCalls ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 shimmer rounded-xl" />
                            ))}
                        </div>
                    ) : calls.length === 0 ? (
                        <div className="text-center py-10">
                            <Video size={36} className="text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No calls yet. Start one!</p>
                            <button
                                onClick={startCall}
                                className="mt-4 px-4 py-2 rounded-lg bg-violet-600/30 text-violet-300 text-sm font-medium hover:bg-violet-600/50 transition-colors"
                            >
                                + New Call
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {calls.map((c) => (
                                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-sm font-bold shrink-0">
                                        {c.initiator?.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{c.initiator?.name || "Unknown"}</p>
                                        <p className="text-xs text-slate-400">{timeAgo(c.createdAt)} · {formatDuration(c.duration)}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "ended" ? "bg-slate-700 text-slate-400" :
                                            c.status === "active" ? "bg-emerald-900/50 text-emerald-400" :
                                                "bg-amber-900/50 text-amber-400"
                                        }`}>
                                        {c.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
