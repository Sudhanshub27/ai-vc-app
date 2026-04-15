"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { User, Mail, Save, ArrowLeft, Loader2, Hand, Video, Clock, LogOut } from "lucide-react";

const roles = [
    { value: "deaf", label: "Deaf / Mute", emoji: "🤟" },
    { value: "hearing", label: "Hearing", emoji: "👂" },
    { value: "both", label: "Both", emoji: "🌐" },
];

export default function ProfilePage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", role: "both" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (!user) { router.push("/login"); return; }
        setForm({ name: user.name, role: user.role });
    }, [user, router, isLoading]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put("/users/me", form);
            toast.success("Profile updated successfully!");
        } catch {
            toast.error("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

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
                        { href: "/history", icon: Clock, label: "Call History" },
                        { href: "/profile", icon: User, label: "My Profile", active: true },
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

                <div className="mb-10">
                    <p className="font-label text-xs text-[#9a442d] mb-2 tracking-[0.1em]">Settings</p>
                    <h1 className="font-serif text-4xl text-[#1b1c1a]">My Profile</h1>
                </div>

                <div className="max-w-lg">
                    {/* Avatar Card */}
                    <div className="bg-[#ffffff] border border-[#dbdad6] p-8 mb-6 tuscan-shadow flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-[#9a442d] flex items-center justify-center text-2xl font-serif text-white shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-serif text-xl text-[#1b1c1a]">{user.name}</p>
                            <p className="text-[#55423e] text-sm font-body">{user.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 border border-[#dbdad6] text-[10px] font-label tracking-widest text-[#9a442d] capitalize bg-[#ffdbd2]/30">{user.role} user</span>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <form onSubmit={handleSave} className="bg-[#ffffff] border border-[#dbdad6] p-8 tuscan-shadow space-y-6">
                        <div>
                            <label className="block font-label text-xs text-[#55423e] mb-2 tracking-[0.1em]">Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88726d]" />
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-[#fbf9f5] border border-[#dbdad6] pl-11 pr-4 py-3.5 text-[#1b1c1a] placeholder-[#dbc1ba] focus:outline-none focus:border-[#9a442d] transition-colors font-body text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-label text-xs text-[#55423e] mb-2 tracking-[0.1em]">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88726d]" />
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full bg-[#f5f3ef] border border-[#dbdad6] pl-11 pr-4 py-3.5 text-[#88726d] cursor-not-allowed font-body text-sm"
                                />
                            </div>
                            <p className="text-xs text-[#88726d] mt-1.5 font-body">Email cannot be changed.</p>
                        </div>

                        <div>
                            <label className="block font-label text-xs text-[#55423e] mb-3 tracking-[0.1em]">My Role</label>
                            <div className="grid grid-cols-3 gap-3">
                                {roles.map((r) => (
                                    <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                                        className={`py-4 text-sm font-body transition-all border ${form.role === r.value
                                            ? "bg-[#ffdbd2]/30 border-[#9a442d] text-[#9a442d] font-semibold"
                                            : "bg-[#fbf9f5] border-[#dbdad6] text-[#55423e] hover:border-[#88726d]"
                                            }`}>
                                        <div className="text-xl mb-1">{r.emoji}</div>
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 h-[52px]">
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                        </button>
                    </form>

                    <button onClick={async () => { await logout(); router.push("/"); }}
                        className="mt-6 w-full py-3.5 border border-[#dbdad6] text-[#ba1a1a] hover:bg-[#ffdbd2]/30 hover:border-[#ba1a1a]/30 font-body font-medium transition-all text-sm">
                        Sign Out
                    </button>
                </div>
            </main>
        </div>
    );
}
