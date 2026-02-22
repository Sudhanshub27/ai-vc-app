"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2, Hand } from "lucide-react";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setSession } = useAuth();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const token = searchParams.get("token");

        if (!token) {
            toast.error("Authentication failed. Please try again.");
            router.replace("/login");
            return;
        }

        // Store token then fetch user profile
        const finishLogin = async () => {
            try {
                // Temporarily store token so api.ts can use it
                localStorage.setItem("accessToken", token);

                const res = await api.get("/users/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const user = res.data.data.user;
                setSession(user, token);

                toast.success(`Welcome, ${user.name}! 🎉`);
                router.replace("/dashboard");
            } catch {
                localStorage.removeItem("accessToken");
                toast.error("Failed to complete sign-in. Please try again.");
                router.replace("/login");
            }
        };

        finishLogin();
    }, [router, searchParams, setSession]);

    return (
        <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse">
                <Hand size={28} className="text-white" />
            </div>
            <div className="flex items-center gap-3 text-slate-300">
                <Loader2 size={20} className="animate-spin text-violet-400" />
                <span className="font-medium">Completing sign-in...</span>
            </div>
            <p className="text-slate-500 text-sm">You will be redirected shortly.</p>
        </div>
    );
}
