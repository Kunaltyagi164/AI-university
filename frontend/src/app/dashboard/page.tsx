"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { 
  Sparkles, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  ArrowUpRight, 
  BrainCircuit, 
  Zap,
  Trophy,
  Play,
  CheckCircle2,
  Target,
  ChevronRight,
  Trophy as ChallengeIcon,
  Flame,
  BarChart2
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [degree, setDegree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memories, setMemories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<{ courseId: number; lessonId: number; lessonTitle: string; courseTitle: string } | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
    if (!token) { router.push("/"); return; }

    // Load user & profile from localStorage immediately
    const storedUser = api.getCurrentUser();
    const storedProfile = localStorage.getItem("nova_profile");
    setUser(storedUser);
    if (storedProfile) { try { setProfile(JSON.parse(storedProfile)); } catch (e) {} }

    const fetchDashboardData = async () => {
      try {
        const degreeData = await api.getDegree();
        setDegree(degreeData);
        localStorage.setItem("nova_degree", JSON.stringify(degreeData));
        
        // Find first incomplete lesson across all courses for "Continue Learning"
        for (const course of degreeData.courses || []) {
          if (course.is_completed) continue;
          try {
            const courseDetail = await api.getCourse(course.id);
            for (const mod of courseDetail.modules || []) {
              for (const les of mod.lessons || []) {
                if (!les.is_completed) {
                  setNextLesson({ courseId: course.id, lessonId: les.id, lessonTitle: les.title, courseTitle: course.title });
                  break;
                }
              }
              if (nextLesson) break;
            }
          } catch (e) { /* skip if error */ }
          break; // Only check first incomplete course
        }

        const memoryNodes = await api.getProfessorMemory();
        setMemories(Array.isArray(memoryNodes) ? memoryNodes : []);

        // Load analytics and daily challenge in parallel
        const [analyticsData, challengeData] = await Promise.all([
          api.getAnalytics().catch(() => null),
          api.getDailyChallenge().catch(() => null),
        ]);
        if (analyticsData) setAnalytics(analyticsData);
        if (challengeData) setDailyChallenge(challengeData);
        
      } catch (err: any) {
        setError(err.message || "Failed to load degree roadmap. Try onboarding again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse mr-2" />
        Synchronizing campus logs...
      </div>
    );
  }

  if (error || !degree) {
    return (
      <div className="min-h-screen bg-[#06060c] flex flex-col items-center justify-center text-center p-4">
        <p className="text-red-400 mb-4">⚠️ {error || "No active degree found."}</p>
        <button 
          onClick={() => router.push("/onboarding")}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm cursor-pointer transition-all"
        >
          Initialize Onboarding Curriculum
        </button>
      </div>
    );
  }

  // Compute overall degree progress
  const totalCourses = degree?.courses?.length || 0;
  const completedCourses = degree?.courses?.filter((c: any) => c.is_completed).length || 0;
  const overallProgress = totalCourses > 0
    ? Math.round(degree.courses.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) / totalCourses)
    : 0;

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-950/20 to-cyan-950/10 border border-purple-500/15 p-6 rounded-2xl">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""} <Sparkles className="h-5 w-5 text-purple-400" />
            </h2>
            <p className="text-sm text-gray-400">
              {profile ? `Level ${profile.level} · ${profile.xp} XP · ${profile.streak || 0} day streak 🔥` : "Your AI mentors are ready."}
            </p>
          </div>
          <button 
            onClick={() => router.push("/classroom")}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg text-xs font-semibold hover:shadow-purple-500/10 transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Talk to AI Professor</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* Continue Learning widget */}
        {nextLesson && (
          <div
            onClick={() => router.push(`/course/${nextLesson.courseId}`)}
            className="flex items-center gap-4 bg-gradient-to-r from-cyan-950/30 to-purple-950/20 border border-cyan-500/25 p-5 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition-all group"
          >
            <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-xl shrink-0">
              <Play className="h-6 w-6 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-cyan-400 font-mono uppercase tracking-widest">Continue Learning</p>
              <p className="text-sm font-bold text-white truncate mt-0.5">{nextLesson.lessonTitle}</p>
              <p className="text-xs text-gray-500 truncate">{nextLesson.courseTitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-cyan-400 transition-colors shrink-0" />
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: GraduationCap, label: "Courses", value: `${completedCourses}/${totalCourses}`, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
            { icon: Zap, label: "Total XP", value: profile?.xp || 0, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { icon: Trophy, label: "Level", value: profile?.level || 1, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
            { icon: Clock, label: "Est. Hours Left", value: degree?.courses?.reduce((s: number, c: any) => s + (c.estimated_hours || 0), 0) || 0, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className={`glass-panel p-5 rounded-xl border ${border} flex items-center space-x-3`}>
              <div className={`p-2.5 ${bg} border ${border} ${color} rounded-lg shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">{label}</p>
                <p className="text-lg font-extrabold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Degree progress bar */}
        <div className="glass-panel rounded-xl border border-white/[0.04] p-5 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" />
              {degree.title}
            </p>
            <span className="text-xs text-gray-400 font-mono">{overallProgress}% overall progress</span>
          </div>
          <div className="h-2.5 bg-purple-950/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">{completedCourses} of {totalCourses} courses completed</p>
        </div>

        {/* Study Analytics Chart */}
        {analytics && (
          <div className="glass-panel rounded-xl border border-white/[0.04] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-cyan-400" />
                14-Day Study Activity
              </p>
              <span className="text-xs text-gray-500 font-mono">XP earned per day</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {(analytics.days || []).map((day: any, i: number) => {
                const maxXp = Math.max(...(analytics.days || []).map((d: any) => d.xp), 1);
                const pct = day.xp > 0 ? Math.max((day.xp / maxXp) * 100, 8) : 4;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${day.date}: ${day.xp} XP, ${day.quizzes} quizzes`}>
                    <div
                      className={`w-full rounded-sm transition-all duration-300 ${
                        day.xp > 0
                          ? "bg-gradient-to-t from-purple-600 to-cyan-500 group-hover:from-purple-500 group-hover:to-cyan-400"
                          : "bg-white/5"
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                    {i % 4 === 0 && (
                      <span className="text-[8px] text-gray-600 font-mono">{day.date}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Challenge card */}
        {dailyChallenge && (
          <div
            onClick={() => router.push("/challenge")}
            className="flex items-center gap-4 bg-gradient-to-r from-amber-950/20 to-orange-950/10 border border-amber-500/25 p-5 rounded-2xl cursor-pointer hover:border-amber-500/50 transition-all group"
          >
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl shrink-0">
              <Flame className="h-6 w-6 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-400 font-mono uppercase tracking-widest">Daily Challenge</p>
              <p className="text-sm font-bold text-white truncate mt-0.5">{dailyChallenge.title}</p>
              <p className="text-xs text-gray-500 truncate">{dailyChallenge.difficulty} · {dailyChallenge.category} · {dailyChallenge.xp_reward} XP</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">2× XP</span>
              <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-amber-400 transition-colors mt-1 ml-auto" />
            </div>
          </div>
        )}

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Course Registry */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-lg font-bold text-white">Your Personal Syllabus</h3>
            
            <div className="space-y-4">
              {degree.courses?.map((course: any) => (
                <div 
                  key={course.id}
                  onClick={() => router.push(`/course/${course.id}`)}
                  className="glass-panel glass-panel-interactive p-6 rounded-xl border border-white/[0.04] cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-purple-400 font-mono border border-purple-500/25 px-2 py-0.5 rounded-full bg-purple-950/20">
                        {course.code}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {course.difficulty} &bull; {course.credits} Credits
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">{course.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xl">{course.description}</p>
                    
                    {/* Progress slider bar */}
                    <div className="pt-2 flex items-center gap-3">
                      <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">
                        {Math.round(course.progress || 0)}% Complete
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {course.is_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-mono uppercase bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 group-hover:border-purple-500/30 transition-all">
                        Study Course
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: AI Mentors & Memory Graphs */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AI Mentors */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Your AI Professors</h3>
              <div className="glass-panel p-5 rounded-xl border border-white/[0.04] space-y-4">
                {[
                  { name: "Professor Albert", style: "Socratic / Story-driven", avatar: "👨‍🏫" },
                  { name: "Athena", style: "Analytical / Direct", avatar: "👩‍🔬" },
                  { name: "Lex", style: "Humorous / Practical", avatar: "👨‍💻" }
                ].map((prof, i) => (
                  <div 
                    key={i}
                    onClick={() => router.push("/classroom")}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl h-10 w-10 bg-purple-500/10 border border-purple-500/25 rounded-lg flex items-center justify-center">
                        {prof.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{prof.name}</p>
                        <p className="text-xs text-gray-400">{prof.style}</p>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Active student memories list */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Adaptive Learning Graph</h3>
              <div className="glass-panel p-5 rounded-xl border border-white/[0.04] space-y-3 max-h-80 overflow-y-auto">
                <p className="text-xs text-gray-400 leading-relaxed flex items-center gap-1.5 font-mono mb-2">
                  <BrainCircuit className="h-4 w-4 text-cyan-400 animate-pulse" />
                  AI OBSERVATIONS REGISTERED
                </p>
                {memories.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No observations recorded yet. Start talking to your professor or executing code in the IDE!</p>
                ) : (
                  memories.map((node, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        node.category === "strength" 
                          ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-300" 
                          : node.category === "mistake"
                          ? "bg-red-950/10 border-red-500/20 text-red-300"
                          : "bg-cyan-950/10 border-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      <div className="flex justify-between items-center font-mono text-[9px] uppercase font-bold">
                        <span>{node.key.replace(/_/g, " ")}</span>
                        <span>{node.category}</span>
                      </div>
                      <p className="leading-relaxed font-sans">{node.value}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>

      </main>
    </div>
  );
}
