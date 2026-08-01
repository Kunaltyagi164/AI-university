"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useToast } from "@/components/ToastProvider";
import {
  Trophy,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Terminal as TermIcon,
  Zap,
  Flame,
  Code2,
  ChevronRight,
  Star,
  Clock,
} from "lucide-react";

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Easy:   { color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-500/30" },
  Medium: { color: "text-amber-400",   bg: "bg-amber-950/20",   border: "border-amber-500/30" },
  Hard:   { color: "text-red-400",     bg: "bg-red-950/20",     border: "border-red-500/30" },
};

export default function ChallengePage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
    if (!token) { router.push("/"); return; }
    loadChallenge();
  }, [router]);

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const ch = await api.getDailyChallenge();
      setChallenge(ch);
      setCode(ch.starter_code || "");
      // Check localStorage for today's completion
      const todayKey = `nova_challenge_done_${ch.date}`;
      const done = typeof window !== "undefined" ? localStorage.getItem(todayKey) : null;
      if (done) {
        setAlreadyCompleted(true);
        setPassed(true);
        setSubmitted(true);
      }
    } catch {
      addToast({ type: "error" as any, title: "Error", message: "Could not load today's challenge." });
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setStdout("Connecting to sandbox...");
    setStderr("");
    setExitCode(null);
    setPassed(null);

    try {
      const res = await api.runCode({ code, language: "python" });
      setStdout(res.stdout || "Execution finished (no output).");
      setStderr(res.stderr || "");
      setExitCode(res.exit_code);
      setPassed(res.passed);

      if (res.passed && !submitted && !alreadyCompleted) {
        handleSubmit(res.passed);
      }
    } catch (e: any) {
      setStdout("");
      setStderr(e.message || "Failed to connect to compiler.");
      setPassed(false);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async (codePassed: boolean) => {
    if (submitted || alreadyCompleted || !challenge) return;
    try {
      const res = await api.submitChallenge({ challenge_id: challenge.id, passed: codePassed });
      if (res.awarded) {
        setSubmitted(true);
        setXpAwarded(res.xp_reward);
        // Persist to localStorage
        const todayKey = `nova_challenge_done_${challenge.date}`;
        if (typeof window !== "undefined") localStorage.setItem(todayKey, "1");
        // Update local profile XP
        const savedProfile = typeof window !== "undefined" ? localStorage.getItem("nova_profile") : null;
        if (savedProfile) {
          const prof = JSON.parse(savedProfile);
          prof.xp = res.new_xp;
          prof.level = res.new_level;
          localStorage.setItem("nova_profile", JSON.stringify(prof));
        }
        addToast({ type: "xp", title: `+${res.xp_reward} XP — Challenge Complete! 🏆`, message: res.message });
      }
    } catch { /* ignore submit error */ }
  };

  const diffStyle = challenge ? (DIFFICULTY_STYLES[challenge.difficulty] || DIFFICULTY_STYLES["Easy"]) : DIFFICULTY_STYLES["Easy"];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-amber-400 font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse mr-2" />
        Loading today's challenge...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden h-screen">

        {/* Left panel — Challenge description */}
        <section className="w-96 border-r border-white/[0.04] bg-[#07070e] flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-5 border-b border-white/[0.04] bg-[#090914] space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Trophy className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-widest">Daily Challenge</p>
                <p className="text-xs text-gray-500 font-mono">{challenge?.date}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs font-bold text-orange-400">{challenge?.xp_reward} XP</span>
              </div>
            </div>

            <h1 className="text-lg font-extrabold text-white">{challenge?.title}</h1>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffStyle.color} ${diffStyle.bg} ${diffStyle.border}`}>
                {challenge?.difficulty}
              </span>
              <span className="px-2 py-0.5 bg-purple-950/20 border border-purple-500/20 text-purple-400 rounded-full text-[10px] font-bold">
                {challenge?.category}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono ml-auto">
                <Star className="h-3 w-3 text-amber-400" />2× XP
              </span>
            </div>
          </div>

          <div className="flex-1 p-5 space-y-5 text-sm">
            {/* Description */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Problem Statement</p>
              <MarkdownRenderer content={challenge?.description || ""} />
            </div>

            {/* Examples */}
            {challenge?.examples?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Examples</p>
                {challenge.examples.map((ex: any, i: number) => (
                  <div key={i} className="bg-[#05050a] border border-white/5 rounded-lg p-3 space-y-1 text-xs font-mono">
                    <p className="text-gray-500">Input: <span className="text-cyan-300">{ex.input}</span></p>
                    <p className="text-gray-500">Output: <span className="text-emerald-300">{ex.output}</span></p>
                    {ex.explanation && <p className="text-gray-600 font-sans text-[11px] mt-1">{ex.explanation}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {challenge?.constraints?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Constraints</p>
                <ul className="space-y-1">
                  {challenge.constraints.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                      <ChevronRight className="h-3 w-3 text-purple-400 shrink-0 mt-0.5" />
                      <span className="font-mono">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Completion badge */}
          {(submitted || alreadyCompleted) && (
            <div className="p-4 m-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center space-y-1">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-emerald-400">Challenge Completed!</p>
              {xpAwarded > 0 && (
                <p className="text-xs text-gray-400">+{xpAwarded} XP awarded</p>
              )}
              <p className="text-[10px] text-gray-600 font-mono">New challenge tomorrow</p>
            </div>
          )}
        </section>

        {/* Right panel — Code editor + terminal */}
        <section className="flex-1 flex flex-col bg-[#080812] h-full overflow-hidden">
          {/* Editor toolbar */}
          <div className="h-12 border-b border-white/[0.04] bg-[#090914] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <Code2 className="h-3.5 w-3.5 text-purple-400" />
              <span>solution.py</span>
              <span className="text-gray-700">|</span>
              <span className="text-purple-400">Python</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCode(challenge?.starter_code || "")}
                className="p-1.5 hover:bg-white/5 border border-transparent rounded text-xs text-gray-500 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Reset to starter code"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleRun}
                disabled={running}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {running ? "Running..." : "Run Code"}
              </button>
            </div>
          </div>

          {/* Code textarea */}
          <div className="flex-1 flex bg-[#06060c] font-mono text-sm overflow-hidden">
            <div className="w-8 select-none text-gray-700 text-right pt-4 pr-3 border-r border-white/5 text-xs leading-relaxed">
              {code.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="flex-1 bg-transparent text-gray-200 outline-none resize-none pl-3 pt-4 font-mono leading-relaxed w-full whitespace-pre"
              spellCheck={false}
            />
          </div>

          {/* Terminal output */}
          <div className="h-52 border-t border-white/[0.04] bg-[#090914] flex flex-col shrink-0">
            <div className="h-8 border-b border-white/[0.04] px-4 bg-[#0a0a16] flex items-center justify-between text-xs text-gray-400 shrink-0">
              <span className="flex items-center gap-1 font-mono">
                <TermIcon className="h-3.5 w-3.5" /> CONSOLE
              </span>
              {passed !== null && (
                <span className={`font-semibold uppercase flex items-center gap-1 ${passed ? "text-emerald-400" : "text-red-400"}`}>
                  {passed ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {passed ? "PASS" : "FAIL"}
                </span>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5">
              {stdout && stdout !== "Connecting to sandbox..." && (
                <div>
                  <span className="text-emerald-500/60 text-[10px] uppercase tracking-widest">stdout</span>
                  <p className="text-emerald-300 whitespace-pre-wrap mt-0.5">{stdout}</p>
                </div>
              )}
              {stderr && (
                <div>
                  <span className="text-red-500/60 text-[10px] uppercase tracking-widest">stderr</span>
                  <p className="text-red-400 whitespace-pre-wrap mt-0.5">{stderr}</p>
                </div>
              )}
              {!stdout && !stderr && (
                <p className="text-gray-600 italic">Run your code to see output...</p>
              )}
              {exitCode !== null && (
                <p className="text-gray-500 border-t border-white/5 pt-1 mt-1">
                  Process exited: <span className={exitCode === 0 ? "text-emerald-400" : "text-red-400"}>{exitCode}</span>
                </p>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
