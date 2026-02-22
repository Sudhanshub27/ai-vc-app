"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { User, Mail, Save, ArrowLeft, Loader2, Hand } from "lucide-react";

const roles = [
    { value: "deaf", label: "Deaf / Mute", emoji: "🤟" },
    { value: "hearing", label: "Hearing", emoji: "👂" },
    { value: "both", label: "Both", emoji: "🌐" },
];

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", role: "both" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        setForm({ name: user.name, role: user.role });
    }, [user, router]);

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
                        { href: "/history", label: "Call History" },
                        { href: "/profile", label: "My Profile", active: true },
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

                <h1 className="font-jakarta font-bold text-3xl text-white mb-8">My Profile</h1>

                <div className="max-w-lg">
                    {/* Avatar */}
                    <div className="glass rounded-2xl p-6 mb-6 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-2xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-jakarta font-semibold text-white text-lg">{user.name}</p>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs glass-purple text-violet-300 capitalize">{user.role} user</span>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="glass rounded-2xl p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full bg-white/3 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-slate-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">My Role</label>
                            <div className="grid grid-cols-3 gap-2">
                                {roles.map((r) => (
                                    <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                                        className={`py-3 rounded-xl text-sm font-medium transition-all border ${form.role === r.value ? "bg-violet-600/30 border-violet-500 text-violet-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/8"}`}>
                                        <div className="text-xl mb-1">{r.emoji}</div>
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 transition-all">
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                        </button>
                    </form>

                    <button onClick={async () => { await logout(); router.push("/"); }}
                        className="mt-4 w-full py-3 rounded-xl glass text-red-400 hover:bg-red-900/10 font-medium transition-all">
                        Sign Out
                    </button>
                </div>
            </main>
        </div>
    );
}
