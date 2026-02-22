"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, Loader2, Hand, Check } from "lucide-react";

const roles = [
    { value: "deaf", label: "Deaf / Mute", emoji: "🤟", desc: "I use sign language" },
    { value: "hearing", label: "Hearing", emoji: "👂", desc: "I can hear & speak" },
    { value: "both", label: "Both", emoji: "🌐", desc: "I use both" },
];

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: "At least 6 characters", ok: password.length >= 6 },
        { label: "Contains a number", ok: /\d/.test(password) },
        { label: "Contains a letter", ok: /[a-zA-Z]/.test(password) },
    ];
    if (!password) return null;
    const score = checks.filter((c) => c.ok).length;
    const color = score === 1 ? "bg-red-500" : score === 2 ? "bg-amber-500" : "bg-emerald-500";
    const label = score === 1 ? "Weak" : score === 2 ? "Fair" : "Strong";
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : "bg-white/10"}`} />
                ))}
                <span className={`text-xs ml-1 ${score === 1 ? "text-red-400" : score === 2 ? "text-amber-400" : "text-emerald-400"}`}>{label}</span>
            </div>
            {checks.map((c) => (
                <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-emerald-400" : "text-slate-500"}`}>
                    <Check size={11} className={c.ok ? "opacity-100" : "opacity-0"} /> {c.label}
                </div>
            ))}
        </div>
    );
}

export default function SignupPage() {
    const { signup, user } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "both" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) router.replace("/dashboard");
    }, [user, router]);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "Name is required";
        else if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
        if (!form.email.trim()) errs.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address";
        if (!form.password) errs.password = "Password is required";
        else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const setField = (field: string, value: string) => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await signup(form.name.trim(), form.email.toLowerCase().trim(), form.password, form.role);
            toast.success("Account created! Welcome to SignBridge 🎉");
            router.push("/dashboard");
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Failed to create account. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/api/auth/google`;
    };

    return (
        <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Hand size={22} className="text-white" />
                        </div>
                        <span className="font-jakarta font-bold text-2xl gradient-text">SignBridge</span>
                    </Link>
                    <h1 className="text-2xl font-jakarta font-bold text-white">Create your account</h1>
                    <p className="text-slate-400 mt-1 text-sm">Join thousands bridging the communication gap</p>
                </div>

                <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
                    {/* Google Sign Up */}
                    <button
                        onClick={handleGoogleSignup}
                        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-200 mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-slate-500 text-xs">or sign up with email</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={(e) => setField("name", e.target.value)}
                                    className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-colors text-sm ${errors.name ? "border-red-500/70 focus:border-red-500" : "border-white/10 focus:border-violet-500"}`}
                                />
                            </div>
                            {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setField("email", e.target.value)}
                                    className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-colors text-sm ${errors.email ? "border-red-500/70 focus:border-red-500" : "border-white/10 focus:border-violet-500"}`}
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPw ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    value={form.password}
                                    onChange={(e) => setField("password", e.target.value)}
                                    className={`w-full bg-white/5 border rounded-xl pl-11 pr-12 py-3 text-white placeholder-slate-600 focus:outline-none transition-colors text-sm ${errors.password ? "border-red-500/70 focus:border-red-500" : "border-white/10 focus:border-violet-500"}`}
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password ? (
                                <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>
                            ) : (
                                <PasswordStrength password={form.password} />
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
                            <div className="grid grid-cols-3 gap-2">
                                {roles.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setField("role", r.value)}
                                        className={`py-3 px-2 rounded-xl text-xs font-medium transition-all border text-center ${form.role === r.value ? "bg-violet-600/30 border-violet-500 text-violet-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/8 hover:text-slate-300"}`}
                                    >
                                        <div className="text-xl mb-1">{r.emoji}</div>
                                        <div className="font-semibold">{r.label}</div>
                                        <div className="text-slate-500 text-[10px] mt-0.5">{r.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/25 mt-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
                        </button>

                        <p className="text-center text-slate-500 text-xs">
                            By signing up you agree to our{" "}
                            <Link href="#" className="text-violet-400 hover:underline">Terms</Link> and{" "}
                            <Link href="#" className="text-violet-400 hover:underline">Privacy Policy</Link>.
                        </p>
                    </form>
                </div>

                <p className="text-center text-slate-400 text-sm mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
