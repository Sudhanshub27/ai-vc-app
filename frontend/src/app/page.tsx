"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Video, Shield, Zap, Users, ChevronRight, Mic,
  Hand, MessageSquare, Globe, Star, ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Hand,
    title: "Sign Language Recognition",
    desc: "AI-powered hand gesture detection translates sign language into real-time captions.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Mic,
    title: "Speech-to-Text Captions",
    desc: "Hearing users' speech is automatically transcribed and shown as captions to deaf users.",
    color: "from-teal-500 to-cyan-600",
  },
  {
    icon: Video,
    title: "HD Video Calling",
    desc: "Crystal-clear peer-to-peer video calling with WebRTC for minimal latency.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "End-to-end encrypted calls with JWT authentication and secure signaling.",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: Zap,
    title: "Low Latency",
    desc: "Optimized WebRTC connections ensure real-time communication with minimal delay.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Globe,
    title: "Accessible Design",
    desc: "Built from the ground up with accessibility in mind for deaf and hearing users alike.",
    color: "from-pink-500 to-rose-500",
  },
];

const stats = [
  { value: "< 50ms", label: "Latency" },
  { value: "HD", label: "Video Quality" },
  { value: "2-Way", label: "Communication" },
  { value: "AI", label: "Powered" },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
              <Hand size={18} className="text-white" />
            </div>
            <span className="font-jakarta font-bold text-lg gradient-text">SignBridge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-900/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative">
        {/* Backdrop orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-purple text-violet-300 text-sm mb-8">
            <Zap size={14} />
            <span>AI-Powered Sign Language Communication</span>
          </div>

          <h1 className="font-jakarta font-bold text-5xl md:text-7xl leading-tight mb-6">
            Break the Barrier.
            <br />
            <span className="gradient-text">Sign Freely.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time video calling with AI-powered sign language recognition and speech-to-text
            captions. Connecting deaf and hearing communities effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-lg hover:from-violet-500 hover:to-purple-500 transition-all shadow-xl shadow-violet-900/40 glow-pulse"
            >
              Start Calling Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl glass text-slate-200 font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Sign In
              <ChevronRight size={20} />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-6">
                <div className="font-jakarta font-bold text-3xl gradient-text mb-1">{s.value}</div>
                <div className="text-slate-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mock Video Call Preview */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-900/20">
            {/* Browser chrome */}
            <div className="bg-white/5 px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="ml-4 flex-1 glass rounded-full px-4 py-1 text-xs text-slate-500">
                signbridge.io/call/live-demo
              </div>
            </div>
            {/* Video grid mock */}
            <div className="p-4 grid grid-cols-2 gap-3 bg-[#0f0f23]" style={{ height: 280 }}>
              <div className="rounded-2xl bg-gradient-to-br from-violet-900/50 to-purple-950/80 flex flex-col items-center justify-center relative overflow-hidden border border-violet-800/30">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl font-bold mb-2">
                  A
                </div>
                <span className="text-sm text-slate-300">Alex (Deaf User)</span>
                <div className="absolute top-3 left-3 flex items-center gap-1 glass px-2 py-1 rounded-full text-xs text-teal-400">
                  <Hand size={12} />
                  Signing
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-teal-900/50 to-cyan-950/80 flex flex-col items-center justify-center relative overflow-hidden border border-teal-800/30">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-2xl font-bold mb-2">
                  S
                </div>
                <span className="text-sm text-slate-300">Sam (Hearing User)</span>
                <div className="absolute top-3 left-3 flex items-center gap-1 glass px-2 py-1 rounded-full text-xs text-emerald-400">
                  <Mic size={12} />
                  Speaking
                </div>
              </div>
            </div>
            {/* Caption bar */}
            <div className="bg-black/40 px-6 py-3 flex items-center gap-3 border-t border-white/5">
              <MessageSquare size={16} className="text-violet-400 shrink-0" />
              <div className="text-sm text-slate-300">
                <span className="text-violet-400 font-medium">AI Caption: </span>
                "Hello, how are you doing today?"
              </div>
              <div className="ml-auto flex items-center gap-1 text-xs text-teal-400">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                Live
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-jakarta font-bold text-4xl mb-4">
              Everything you need to{" "}
              <span className="gradient-text">communicate</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              SignBridge combines cutting-edge AI with seamless video calling technology.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 hover:bg-white/6 transition-all group cursor-default"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-jakarta font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-teal-600/10 pointer-events-none" />
          <Star size={20} className="text-violet-400 mx-auto mb-4" />
          <h2 className="font-jakarta font-bold text-4xl mb-4">Ready to bridge the gap?</h2>
          <p className="text-slate-400 mb-8">
            Join thousands of users communicating freely across barriers.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-teal-600 text-white font-semibold text-lg hover:from-violet-500 hover:to-teal-500 transition-all shadow-xl"
          >
            Create Free Account
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
              <Hand size={14} className="text-white" />
            </div>
            <span className="font-jakarta font-bold gradient-text">SignBridge</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 SignBridge. Built for accessible communication.</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-slate-300 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
