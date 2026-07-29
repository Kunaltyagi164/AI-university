"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import {
  Trophy,
  Zap,
  Flame,
  Crown,
  Medal,
  Star,
  BarChart2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  full_name: string;
  email: string;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  career_goal: string;
}

const RANK_STYLES: Record<number, { bg: string; border: string; badge: string; label: string; icon: any }> = {
  1: { bg: "bg-gradient-to-r from-amber-950/40 to-yellow-950/30", border: "border-amber-400/40", badge: "bg-gradient-to-r from-amber-500 to-yellow-500", label: "Gold Champion", icon: Crown },
  2: { bg: "bg-gradient-to-r from-slate-800/40 to-gray-900/30", border: "border-slate-400/30", badge: "bg-gradient-to-r from-slate-400 to-gray-300", label: "Silver Elite", icon: Medal },
  3: { bg: "bg-gradient-to-r from-orange-950/40 to-amber-950/30", border: "border-orange-500/30", badge: "bg-gradient-to-r from-orange-600 to-amber-600", label: "Bronze Scholar", icon: Star },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarGradient(rank: number): string {
  const gradients = [
    "from-amber-500 to-yellow-600",
    "from-slate-400 to-gray-500",
    "from-orange-500 to-amber-600",
    "from-purple-600 to-cyan-600",
    "from-pink-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
  ];
  return gradients[(rank - 1) % gradients.length];
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    setRefreshing(true);
    try {
      const data = await api.getLeaderboard(50);
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
    if (!token) { router.push("/"); return; }

    const storedUser = api.getCurrentUser();
    if (storedUser) setCurrentUserId(storedUser.id);

    fetchLeaderboard();
  }, [router]);

  const myEntry = leaderboard.find(e => e.user_id === currentUserId);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-purple-400 font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse mr-2" />
        Compiling global rankings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <div className="border-b border-white/[0.04] bg-[#080810] px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-400" />
              Global Leaderboard
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-1">Top students ranked by XP across NOVA University</p>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-medium cursor-pointer transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="p-8 max-w-4xl mx-auto space-y-8">

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-sm rounded-lg">
              ⚠️ {error}
            </div>
          )}

          {/* Your Rank Banner (if not in top 3) */}
          {myEntry && myEntry.rank > 3 && (
            <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/20 to-cyan-950/10 flex items-center gap-4">
              <div className="text-center shrink-0">
                <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Your Rank</p>
                <p className="text-4xl font-extrabold text-purple-400">#{myEntry.rank}</p>
              </div>
              <div className="h-10 w-px bg-white/10 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{myEntry.full_name} <span className="text-purple-400 text-xs">(You)</span></p>
                <p className="text-xs text-gray-400">{myEntry.career_goal} · Level {myEntry.level}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <div className="text-center">
                  <p className="text-amber-400 font-bold text-lg">{myEntry.xp}</p>
                  <p className="text-gray-500">XP</p>
                </div>
                <div className="text-center">
                  <p className="text-orange-400 font-bold text-lg">{myEntry.streak}</p>
                  <p className="text-gray-500">Streak</p>
                </div>
              </div>
            </div>
          )}

          {/* Podium — Top 3 */}
          {topThree.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-amber-400" /> Hall of Champions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topThree.map((entry) => {
                  const style = RANK_STYLES[entry.rank] || RANK_STYLES[3];
                  const Icon = style.icon;
                  const isMe = entry.user_id === currentUserId;
                  return (
                    <div
                      key={entry.user_id}
                      className={`glass-panel p-6 rounded-2xl border ${style.border} ${style.bg} text-center space-y-4 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300 ${
                        isMe ? "ring-2 ring-purple-500/50 ring-offset-1 ring-offset-transparent" : ""
                      }`}
                    >
                      {/* Rank badge */}
                      <div className={`absolute top-3 right-3 ${style.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg`}>
                        #{entry.rank}
                      </div>

                      {isMe && (
                        <div className="absolute top-3 left-3 text-[10px] bg-purple-500/30 border border-purple-500/40 text-purple-400 px-2 py-0.5 rounded-full font-bold">
                          YOU
                        </div>
                      )}

                      {/* Crown/Medal icon */}
                      <div className={`mx-auto w-12 h-12 ${style.badge} rounded-full flex items-center justify-center shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>

                      {/* Avatar */}
                      <div className={`mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br ${getAvatarGradient(entry.rank)} flex items-center justify-center text-xl font-extrabold text-white border-2 border-white/20 shadow-md`}>
                        {getInitials(entry.full_name)}
                      </div>

                      <div>
                        <p className="font-bold text-white text-base">{entry.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{entry.career_goal}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-center gap-4 text-xs font-mono">
                        <div className="text-center">
                          <p className="text-amber-400 font-bold text-lg">{entry.xp}</p>
                          <p className="text-gray-500 flex items-center gap-0.5 justify-center"><Zap className="h-3 w-3" />XP</p>
                        </div>
                        <div className="text-center">
                          <p className="text-purple-400 font-bold text-lg">{entry.level}</p>
                          <p className="text-gray-500 flex items-center gap-0.5 justify-center"><Trophy className="h-3 w-3" />Lvl</p>
                        </div>
                        <div className="text-center">
                          <p className="text-orange-400 font-bold text-lg">{entry.streak}</p>
                          <p className="text-gray-500 flex items-center gap-0.5 justify-center"><Flame className="h-3 w-3" />Days</p>
                        </div>
                      </div>

                      {/* XP Bar */}
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${style.badge} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min((entry.xp % 100), 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">Level {entry.level} · {entry.xp % 100}/100 XP to next</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-cyan-400" /> Full Rankings
              </h2>
              <div className="space-y-2">
                {rest.map((entry) => {
                  const isMe = entry.user_id === currentUserId;
                  return (
                    <div
                      key={entry.user_id}
                      className={`glass-panel p-4 rounded-xl border flex items-center gap-4 transition-all ${
                        isMe
                          ? "border-purple-500/30 bg-purple-950/10"
                          : "border-white/[0.04] hover:border-white/10"
                      }`}
                    >
                      {/* Rank number */}
                      <div className="w-8 text-center shrink-0">
                        <span className="text-sm font-bold text-gray-500 font-mono">#{entry.rank}</span>
                      </div>

                      {/* Avatar */}
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(entry.rank)} flex items-center justify-center text-sm font-extrabold text-white shrink-0`}>
                        {getInitials(entry.full_name)}
                      </div>

                      {/* Name + goal */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {entry.full_name}
                          {isMe && <span className="ml-2 text-[10px] text-purple-400 font-mono">(You)</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{entry.career_goal}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-5 text-xs font-mono shrink-0">
                        <div className="text-center hidden sm:block">
                          <p className="text-amber-400 font-bold">{entry.xp}</p>
                          <p className="text-gray-600">XP</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-purple-400 font-bold">Lv.{entry.level}</p>
                          <p className="text-gray-600">Level</p>
                        </div>
                        <div className="text-center">
                          <p className="text-orange-400 font-bold flex items-center gap-0.5">
                            <Flame className="h-3 w-3" />{entry.streak}d
                          </p>
                          <p className="text-gray-600">Streak</p>
                        </div>
                      </div>

                      {/* XP mini bar */}
                      <div className="w-20 hidden md:block">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                            style={{ width: `${Math.min((entry.xp % 100), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {leaderboard.length === 0 && !error && (
            <div className="text-center py-16 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No students ranked yet. Be the first to earn XP!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
