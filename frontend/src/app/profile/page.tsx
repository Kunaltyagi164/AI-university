"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/ToastProvider";
import {
  User, Zap, Trophy, Coins, Flame, BookOpen, Brain, Shield, Star,
  TrendingUp, AlertTriangle, CheckCircle, Save, GraduationCap, BarChart3
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [degree, setDegree] = useState<any>(null);
  const [memory, setMemory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editStyle, setEditStyle] = useState("");
  const [editSpeed, setEditSpeed] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
    if (!token) { router.push("/"); return; }

    const storedUser = api.getCurrentUser();
    setUser(storedUser);

    const storedProfile = localStorage.getItem("nova_profile");
    if (storedProfile) {
      const p = JSON.parse(storedProfile);
      setProfile(p);
      setEditName(storedUser?.full_name || "");
      setEditStyle(p.preferred_teaching_style || "socratic");
      setEditSpeed(p.learning_speed || "normal");
    }

    // Load degree and memory
    const loadData = async () => {
      try {
        const [degreeData, memData] = await Promise.all([
          api.getDegree().catch(() => null),
          api.getProfessorMemory().catch(() => ({ nodes: [] })),
        ]);
        setDegree(degreeData);
        setMemory(memData?.nodes || []);
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    };
    loadData();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Optimistic local update
      if (profile) {
        const updated = { ...profile, preferred_teaching_style: editStyle, learning_speed: editSpeed };
        localStorage.setItem("nova_profile", JSON.stringify(updated));
        setProfile(updated);
      }
      addToast({ type: "success", title: "Profile updated!", message: "Your learning preferences have been saved." });
    } catch (e) {
      addToast({ type: "error", title: "Save failed", message: "Could not update profile." });
    } finally {
      setSaving(false);
    }
  };

  const xpToNextLevel = profile ? ((profile.level) * 100) - profile.xp + ((profile.level - 1) * 100) : 0;
  const xpProgress = profile ? ((profile.xp % 100) / 100) * 100 : 0;

  const strengthNodes = memory.filter(n => n.category === "strength");
  const weaknessNodes = memory.filter(n => n.category === "weakness");
  const milestoneNodes = memory.filter(n => n.category === "milestone");

  const completedCourses = degree?.courses?.filter((c: any) => c.is_completed).length || 0;
  const totalCourses = degree?.courses?.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse mr-2" />
        Loading student profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/[0.04] bg-[#080810] px-8 py-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-purple-400" />
            Student Profile
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">Your academic identity and progress metrics</p>
        </div>

        <div className="p-8 max-w-5xl mx-auto space-y-8">

          {/* Identity card */}
          <div className="glass-panel rounded-2xl border border-white/[0.06] p-6 flex flex-col sm:flex-row gap-6 items-start">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <span className="text-3xl font-extrabold text-white">
                {(user?.full_name || "S").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">Display Name</p>
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 w-full max-w-xs transition-all"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1 font-mono">{user?.email}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="px-2.5 py-1 bg-purple-950/40 border border-purple-500/25 text-purple-400 rounded-full text-xs font-semibold">
                  Level {profile?.level || 1} Student
                </span>
                <span className="px-2.5 py-1 bg-amber-950/30 border border-amber-500/25 text-amber-400 rounded-full text-xs font-semibold">
                  {profile?.streak || 0} Day Streak 🔥
                </span>
                <span className="px-2.5 py-1 bg-cyan-950/30 border border-cyan-500/25 text-cyan-400 rounded-full text-xs font-semibold">
                  {profile?.career_goal || "AI Specialist"}
                </span>
              </div>
            </div>
          </div>

          {/* XP / Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: "Total XP", value: profile?.xp || 0, color: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-500/20" },
              { icon: Trophy, label: "Level", value: profile?.level || 1, color: "text-purple-400", bg: "bg-purple-950/30", border: "border-purple-500/20" },
              { icon: Star, label: "Coins", value: profile?.coins || 0, color: "text-yellow-400", bg: "bg-yellow-950/30", border: "border-yellow-500/20" },
              { icon: GraduationCap, label: "Courses Done", value: `${completedCourses}/${totalCourses}`, color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-500/20" },
            ].map(({ icon: Icon, label, value, color, bg, border }) => (
              <div key={label} className={`glass-panel rounded-xl border ${border} p-4 space-y-2`}>
                <div className={`p-2 ${bg} rounded-lg w-fit`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-xs text-gray-500 font-mono">{label}</p>
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* XP progress bar */}
          <div className="glass-panel rounded-xl border border-white/[0.06] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-purple-400" /> Level Progress
              </p>
              <p className="text-xs text-gray-500 font-mono">{profile?.xp % 100}/100 XP to Level {(profile?.level || 1) + 1}</p>
            </div>
            <div className="h-3 bg-purple-950/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* Learning preferences */}
          <div className="glass-panel rounded-xl border border-white/[0.06] p-6 space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" /> Learning Preferences
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-mono uppercase tracking-widest">Teaching Style</label>
                <select
                  value={editStyle}
                  onChange={e => setEditStyle(e.target.value)}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
                >
                  <option value="socratic">Socratic (Question-driven)</option>
                  <option value="visual">Visual (Diagrams & charts)</option>
                  <option value="practical">Practical (Project-based)</option>
                  <option value="academic">Academic (Theory-first)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-mono uppercase tracking-widest">Learning Speed</label>
                <select
                  value={editSpeed}
                  onChange={e => setEditSpeed(e.target.value)}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
                >
                  <option value="slow">Slow & Deep</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast Track</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>

          {/* Memory graph */}
          {memory.length > 0 && (
            <div className="glass-panel rounded-xl border border-white/[0.06] p-6 space-y-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-400" /> AI Memory Profile
                <span className="ml-auto text-xs text-gray-500 font-mono">{memory.length} memory nodes</span>
              </h2>

              <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-emerald-400">{strengthNodes.length}</p>
                  <p className="text-gray-500">Strengths</p>
                </div>
                <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-400">{weaknessNodes.length}</p>
                  <p className="text-gray-500">Weaknesses</p>
                </div>
                <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3">
                  <Shield className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-400">{milestoneNodes.length}</p>
                  <p className="text-gray-500">Milestones</p>
                </div>
              </div>

              {weaknessNodes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-red-400 font-mono uppercase tracking-wider">Areas to Review</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {weaknessNodes.slice(0, 8).map((n, i) => (
                      <div key={i} className="flex items-start gap-2 bg-red-950/20 border border-red-500/15 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400 leading-relaxed">{n.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Degree overview */}
          {degree && (
            <div className="glass-panel rounded-xl border border-white/[0.06] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" /> Enrolled Degree
              </h2>
              <p className="text-sm font-semibold text-white">{degree.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{degree.description}</p>
              <div className="space-y-2">
                {degree.courses?.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${c.is_completed ? "bg-emerald-400" : "bg-gray-600"}`} />
                    <p className="text-xs text-gray-400 flex-1">{c.code} — {c.title}</p>
                    <span className="text-xs font-mono text-gray-500">{Math.round(c.progress || 0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
