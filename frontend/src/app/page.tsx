"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  GraduationCap, 
  Sparkles, 
  Brain, 
  Terminal, 
  Award, 
  FlaskConical, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Check if already authenticated + load saved theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("nova_token");
      if (token) {
        router.push("/dashboard");
      }
      // Sync theme from localStorage
      const savedTheme = (localStorage.getItem("nova_theme") as "dark" | "light") || "dark";
      setTheme(savedTheme);
    }
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("nova_theme", newTheme);
      if (newTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await api.login({ email, password });
      } else {
        await api.signup({ email, password, full_name: fullName });
      }
      
      // Pull student degree profile to verify if they have completed onboarding
      try {
        const degree = await api.getDegree();
        if (degree && degree.id) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } catch (err) {
        // No degree found means redirect to onboarding
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: "AI Professor & Mentors",
      description: "Dialogue with socratic models who adapt explanations, remember your struggles, and guide you forever.",
      icon: Brain,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Built-in IDE & Coding Lab",
      description: "Write code and receive security scans, complexity analysis, and direct correction reports in real-time.",
      icon: Terminal,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
    },
    {
      title: "AI Examination Center",
      description: "Auto-graded MCQs and short-answer exams that update your skill proficiency profile dynamically.",
      icon: Award,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "AI Research Assistant",
      description: "Compile outline drafts, suggest bibliography citations, and structure experimental hypotheses.",
      icon: FlaskConical,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 sm:px-6 lg:px-8 bg-[#06060c]">
      {/* Navbar Header */}
      <header className="max-w-7xl mx-auto w-full py-6 flex justify-between items-center border-b border-white/[0.04]">
        <div className="flex items-center bg-white rounded-xl px-2 py-1 shadow-lg shadow-purple-900/20">
          <Image
            src="/logo.png"
            alt="NOVA AI University"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono bg-cyan-950/20 border border-cyan-500/20 px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            SYSTEMS ACTIVE: v1.0.0
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-theme-fg/70 hover:text-theme-fg cursor-pointer transition-all"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12">
        {/* Left Side: Brand Text & Features */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="h-3 w-3" />
              <span>THE DECENTRALIZED DIGITAL CAMPUS</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              One University. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                Infinite Knowledge.
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl">
              NOVA generates complete personalized degree roadmaps, compiles interactive textbooks, evaluates exams, and guides you with an AI Professor that learns how you learn.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="glass-panel p-5 rounded-xl border border-white/[0.04] space-y-3">
                  <div className={`p-2 w-10 h-10 border rounded-lg flex items-center justify-center ${feat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white text-base">{feat.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Auth Widget Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.06] w-full max-w-md shadow-2xl relative overflow-hidden">
            {/* Glowing Accent Border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isLogin ? "Sign In to Campus" : "Create Student Account"}
              </h2>
              <p className="text-sm text-gray-400">
                {isLogin ? "Enter your credentials to access your courses." : "Begin your personalized university education."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                  placeholder="name@domain.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-purple-500/20 active:translate-y-[1px] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Accessing Campus...</span>
                ) : (
                  <>
                    <span>{isLogin ? "Sign In" : "Register and Start"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/[0.04] text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {isLogin ? "New to NOVA? Create an account instead" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Details */}
      <footer className="max-w-7xl mx-auto w-full py-8 text-center text-xs text-gray-600 border-t border-white/[0.02]">
        <p className="flex justify-center items-center gap-1.5 mb-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500/60" /> GDPR compliant data storage & secured cryptographic student keys.
        </p>
        <p>&copy; 2026 NOVA AI University. All rights reserved. Transforming global education with personalized intelligence.</p>
      </footer>
    </div>
  );
}
