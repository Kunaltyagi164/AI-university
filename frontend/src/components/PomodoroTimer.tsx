"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, Coffee, Zap } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

type Phase = "work" | "break";

export default function PomodoroTimer() {
  const { addToast } = useToast();
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = phase === "work" ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  // Circumference for SVG circle
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const switchPhase = useCallback((next: Phase) => {
    setPhase(next);
    setSecondsLeft(next === "work" ? WORK_MINUTES * 60 : BREAK_MINUTES * 60);
    setRunning(false);
  }, []);

  const handleComplete = useCallback(() => {
    setRunning(false);
    if (phase === "work") {
      setSessions(s => s + 1);
      // Award XP via localStorage
      const savedProfile = typeof window !== "undefined" ? localStorage.getItem("nova_profile") : null;
      if (savedProfile) {
        const prof = JSON.parse(savedProfile);
        prof.xp = (prof.xp || 0) + 25;
        localStorage.setItem("nova_profile", JSON.stringify(prof));
      }
      addToast({ type: "xp", title: "+25 XP — Focus Session Complete!", message: "25-minute Pomodoro session finished. Take a break!" });
      switchPhase("break");
    } else {
      addToast({ type: "info" as any, title: "Break Over!", message: "Ready for your next focus session?" });
      switchPhase("work");
    }
  }, [phase, switchPhase, addToast]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, handleComplete]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(phase === "work" ? WORK_MINUTES * 60 : BREAK_MINUTES * 60);
  };

  const phaseColor = phase === "work" ? "#a855f7" : "#22d3ee";
  const phaseBg = phase === "work" ? "border-purple-500/30 bg-purple-950/20" : "border-cyan-500/30 bg-cyan-950/20";

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        title="Open Pomodoro Timer"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
          running
            ? "border-purple-500/50 bg-purple-950/30 text-purple-300 animate-pulse"
            : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20"
        }`}
      >
        <Timer className="h-3.5 w-3.5" />
        {running ? `${mins}:${secs}` : "Pomodoro"}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${phaseBg} transition-all`}>
      {/* Circular SVG countdown */}
      <div className="relative shrink-0 cursor-pointer" onClick={() => setExpanded(false)} title="Collapse timer">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={phaseColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {phase === "work"
            ? <Zap className="h-3 w-3 text-purple-400" />
            : <Coffee className="h-3 w-3 text-cyan-400" />
          }
          <span className="text-[10px] font-bold text-white font-mono leading-none mt-0.5">
            {mins}:{secs}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${phase === "work" ? "text-purple-400" : "text-cyan-400"}`}>
            {phase === "work" ? "Focus" : "Break"}
          </span>
          {sessions > 0 && (
            <span className="text-[9px] text-gray-500 font-mono ml-1">×{sessions}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRunning(r => !r)}
            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title={running ? "Pause" : "Start"}
          >
            {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
          </button>
          <button
            onClick={reset}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            onClick={() => switchPhase(phase === "work" ? "break" : "work")}
            className="px-2 py-0.5 rounded text-[9px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono transition-all cursor-pointer"
            title="Switch phase"
          >
            {phase === "work" ? "Break" : "Focus"}
          </button>
        </div>
      </div>
    </div>
  );
}
