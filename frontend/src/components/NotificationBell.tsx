"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Zap, Trophy, Flame, BookOpen, Award, CheckCircle2, AlertTriangle } from "lucide-react";

interface Notification {
  id: string;
  type: "xp" | "level" | "streak" | "course" | "exam" | "info" | "warning";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const TYPE_CONFIG = {
  xp:      { icon: Zap,         color: "text-amber-400",  bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  level:   { icon: Trophy,      color: "text-purple-400", bg: "bg-purple-500/10",  border: "border-purple-500/20" },
  streak:  { icon: Flame,       color: "text-orange-400", bg: "bg-orange-500/10",  border: "border-orange-500/20" },
  course:  { icon: BookOpen,    color: "text-cyan-400",   bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
  exam:    { icon: Award,       color: "text-emerald-400",bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  info:    { icon: CheckCircle2,color: "text-blue-400",   bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  warning: { icon: AlertTriangle,color:"text-yellow-400", bg: "bg-yellow-500/10",  border: "border-yellow-500/20" },
};

function generateNotificationsFromProfile(profile: any): Notification[] {
  if (!profile) return [];
  const notes: Notification[] = [];
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (profile.xp >= 100) {
    notes.push({
      id: "xp-milestone",
      type: "xp",
      title: `${profile.xp} XP Accumulated`,
      message: "Your dedication is paying off — keep studying!",
      timestamp: now,
      read: false,
    });
  }
  if (profile.level > 1) {
    notes.push({
      id: `level-${profile.level}`,
      type: "level",
      title: `Level ${profile.level} Achieved! 🏆`,
      message: `You've reached Level ${profile.level}. Your AI professors are unlocking harder content.`,
      timestamp: now,
      read: false,
    });
  }
  if (profile.streak >= 3) {
    notes.push({
      id: `streak-${profile.streak}`,
      type: "streak",
      title: `${profile.streak}-Day Streak! 🔥`,
      message: "Consistency is the key to mastery. Keep your streak alive!",
      timestamp: now,
      read: false,
    });
  }
  if (profile.coins >= 10) {
    notes.push({
      id: "coins-10",
      type: "xp",
      title: `${profile.coins} Coins Earned 💰`,
      message: "Coins unlock future marketplace rewards. Keep collecting!",
      timestamp: now,
      read: false,
    });
  }
  // Always include a welcome note
  notes.push({
    id: "welcome",
    type: "info",
    title: "Welcome to NOVA AI University",
    message: "Your personalized degree roadmap is ready. Explore your courses from the Dashboard.",
    timestamp: "Today",
    read: true,
  });
  return notes;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build notifications from localStorage profile
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("nova_profile") : null;
    const profile = raw ? JSON.parse(raw) : null;

    // Merge stored read-state with generated notifications
    const stored = typeof window !== "undefined" ? localStorage.getItem("nova_notifications") : null;
    const storedReadIds: Set<string> = stored ? new Set(JSON.parse(stored)) : new Set();

    const generated = generateNotificationsFromProfile(profile).map(n => ({
      ...n,
      read: storedReadIds.has(n.id) ? true : n.read,
    }));
    setNotifications(generated);
  }, [open]); // Refresh on open

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("nova_notifications", JSON.stringify(updated.map(n => n.id)));
    }
  };

  const dismiss = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("nova_notifications", JSON.stringify(updated.map(n => n.id)));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-theme-fg/70 hover:text-theme-fg cursor-pointer transition-all"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-purple-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-[#06060c] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 glass-panel rounded-2xl border border-white/[0.08] shadow-2xl shadow-purple-900/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-purple-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-full text-[9px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-gray-400 hover:text-purple-400 transition-colors cursor-pointer font-mono"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 font-mono">
                No notifications yet. Start studying!
              </div>
            ) : (
              notifications.map(note => {
                const cfg = TYPE_CONFIG[note.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={note.id}
                    className={`relative flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] transition-colors ${
                      note.read ? "opacity-60" : "bg-white/[0.02]"
                    }`}
                  >
                    {!note.read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-purple-400" />
                    )}
                    <div className={`p-1.5 ${cfg.bg} border ${cfg.border} rounded-lg shrink-0 mt-0.5`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white leading-snug">{note.title}</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">{note.message}</p>
                      <p className="text-[10px] text-gray-600 font-mono mt-1">{note.timestamp}</p>
                    </div>
                    <button
                      onClick={() => dismiss(note.id)}
                      className="shrink-0 p-0.5 text-gray-600 hover:text-gray-400 cursor-pointer transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/[0.05] text-center">
            <p className="text-[10px] text-gray-600 font-mono">
              Notifications refresh with your profile activity
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
