"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, Loader2, Hand } from "lucide-react";

export default function SignupPage() {
    const { signup, user } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user) router.replace("/dashboard");
    }, [user, router]);

    const validate = () => {
        const errs: { name?: string; email?: string; password?: string } = {};
        if (!form.name.trim()) errs.name = "Name is required";
        if (!form.email.trim()) errs.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email";
        if (!form.password) errs.password = "Password is required";
        else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await signup(form.name, form.email, form.password);
            toast.success("Account created successfully!");
            router.push("/dashboard");
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Failed to create account";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/api/auth/google/mock`;
    };

    return (
        <div className="min-h-screen bg-[#fbf9f5] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-10 mt-8">
                    <Link href="/" className="inline-flex flex-col items-center mb-6">
                        <Hand size={32} className="text-[#9a442d] mb-3" />
                        <span className="font-serif font-semibold text-2xl text-[#1b1c1a]">SignBridge</span>
                    </Link>
                    <h1 className="text-3xl font-serif text-[#1b1c1a] mb-2">Create an account</h1>
                    <p className="text-[#55423e] font-body text-sm tracking-wide">Join thousands of users today.</p>
                </div>

                <div className="bg-[#ffffff] p-8 md:p-10 border border-[#dbdad6] tuscan-shadow">
                    {/* Google Sign Up */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#f5f3ef] border border-[#dbdad6] text-[#1b1c1a] font-body text-sm uppercase tracking-wider font-semibold hover:bg-[#eae8e4] hover:border-[#88726d] transition-all mb-8"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign up with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 h-px bg-[#dbdad6]" />
                        <span className="text-[#88726d] font-label text-[10px] tracking-widest uppercase">Or email</span>
                        <div className="flex-1 h-px bg-[#dbdad6]" />
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block font-label text-xs text-[#55423e] mb-2 tracking-[0.1em]">Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88726d]" />
                                <input
                                    type="text"
                                    placeholder="Jane Doe"
                                    value={form.name}
                                    onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }); }}
                                    className={`w-full bg-[#fbf9f5] border pl-11 pr-4 py-3.5 text-[#1b1c1a] placeholder-[#dbc1ba] focus:outline-none transition-colors font-body text-sm ${errors.name ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : "border-[#dbdad6] focus:border-[#9a442d]"}`}
                                />
                            </div>
                            {errors.name && <p className="text-[#ba1a1a] font-body text-xs mt-2">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block font-label text-xs text-[#55423e] mb-2 tracking-[0.1em]">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88726d]" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
                                    className={`w-full bg-[#fbf9f5] border pl-11 pr-4 py-3.5 text-[#1b1c1a] placeholder-[#dbc1ba] focus:outline-none transition-colors font-body text-sm ${errors.email ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : "border-[#dbdad6] focus:border-[#9a442d]"}`}
                                />
                            </div>
                            {errors.email && <p className="text-[#ba1a1a] font-body text-xs mt-2">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block font-label text-xs text-[#55423e] mb-2 tracking-[0.1em]">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88726d]" />
                                <input
                                    type={showPw ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: undefined }); }}
                                    className={`w-full bg-[#fbf9f5] border pl-11 pr-12 py-3.5 text-[#1b1c1a] placeholder-[#dbc1ba] focus:outline-none transition-colors font-body text-sm ${errors.password ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : "border-[#dbdad6] focus:border-[#9a442d]"}`}
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#88726d] hover:text-[#55423e] transition-colors">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-[#ba1a1a] font-body text-xs mt-2">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-4 flex justify-center items-center h-[52px]"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign Up"}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-10">
                    <p className="font-body text-[#55423e] text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[#9a442d] underline underline-offset-4 hover:text-[#e07a5f] font-semibold transition-colors">
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
