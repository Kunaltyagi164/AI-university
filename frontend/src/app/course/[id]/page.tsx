"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useToast } from "@/components/ToastProvider";
import { 
  BookOpen, 
  Layers, 
  ArrowLeft, 
  CheckCircle, 
  Sparkles, 
  ChevronRight,
  Bookmark,
  Keyboard,
  Award
} from "lucide-react";

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.id);
  const { addToast } = useToast();
  
  const [course, setCourse] = useState<any>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Workspace Tab: "lecture", "textbook", "flashcards"
  const [activeTab, setActiveTab] = useState("lecture");
  
  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const cData = await api.getCourse(courseId);
        setCourse(cData);
        
        // Find first incomplete lesson to set active
        let firstLessonId = null;
        for (const mod of cData.modules || []) {
          for (const les of mod.lessons || []) {
            if (!firstLessonId) firstLessonId = les.id;
            if (!les.is_completed) {
              setActiveLessonId(les.id);
              return;
            }
          }
        }
        if (firstLessonId) setActiveLessonId(firstLessonId);
      } catch (err: any) {
        setError(err.message || "Failed to load course detail.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (!activeLessonId) return;

    const fetchLessonData = async () => {
      setLessonLoading(true);
      setError("");
      try {
        const lData = await api.getLesson(activeLessonId);
        setLessonData(lData);
        
        // Decode flashcards JSON
        try {
          const cards = JSON.parse(lData.flashcards_json || "[]");
          setFlashcards(cards);
        } catch (e) {
          setFlashcards([]);
        }
        
        setCardIndex(0);
        setCardFlipped(false);
      } catch (err: any) {
        setError("Failed to compile lesson materials. Verify LLM configuration.");
      } finally {
        setLessonLoading(false);
      }
    };

    fetchLessonData();
  }, [activeLessonId]);

  // Keyboard shortcuts for flashcards
  useEffect(() => {
    if (activeTab !== "flashcards") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setCardFlipped(f => !f); }
      if (e.key === "ArrowRight" && cardIndex < flashcards.length - 1) { setCardIndex(i => i + 1); setCardFlipped(false); }
      if (e.key === "ArrowLeft" && cardIndex > 0) { setCardIndex(i => i - 1); setCardFlipped(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, cardIndex, flashcards.length]);

  const handleCompleteLesson = async () => {
    if (!activeLessonId) return;
    try {
      const res = await api.completeLesson(activeLessonId);
      
      // Update local profile
      const savedProfile = localStorage.getItem("nova_profile");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        const prevLevel = profile.level;
        profile.xp = res.xp;
        profile.level = res.level;
        profile.coins += 5;
        localStorage.setItem("nova_profile", JSON.stringify(profile));
        // Toast notifications
        addToast({ type: "xp", title: "+25 XP Earned!", message: "Lesson marked complete. Keep the streak going!" });
        if (res.level > prevLevel) {
          setTimeout(() => addToast({ type: "levelup", title: `Level Up! → Level ${res.level}`, message: "You've reached a new mastery tier!", duration: 5000 }), 800);
        }
      }

      const updatedCourse = await api.getCourse(courseId);
      setCourse(updatedCourse);
      
      // Select next lesson
      let foundActive = false;
      for (const mod of updatedCourse.modules || []) {
        for (const les of mod.lessons || []) {
          if (foundActive) { setActiveLessonId(les.id); return; }
          if (les.id === activeLessonId) foundActive = true;
        }
      }
    } catch (e) {
      addToast({ type: "error", title: "Failed to complete lesson", message: "Check your connection and try again." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse mr-2" />
        Compiling curriculum nodes...
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-[#06060c] flex flex-col items-center justify-center text-center p-4">
        <p className="text-red-400 mb-4">⚠️ {error}</p>
        <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-purple-600 rounded text-white text-sm">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Course Toolbar Header */}
        <header className="h-16 border-b border-white/[0.04] bg-[#080810] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">{course.title}</h2>
              <p className="text-xs text-gray-400 font-mono">{course.code} &bull; Progress: {Math.round(course.progress || 0)}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {course.is_completed && (
              <button
                onClick={() => router.push(`/certificate/${courseId}`)}
                className="px-3.5 py-1.5 bg-amber-950/20 hover:bg-amber-900/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Award className="h-3.5 w-3.5" />
                View Certificate
              </button>
            )}
            <button
              onClick={() => router.push("/ide")}
              className="px-3.5 py-1.5 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              Launch IDE Coding Lab
            </button>
          </div>
        </header>

        {/* Content Workspace split screen */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Syllabus Navigation Panel */}
          <aside className="w-80 border-r border-white/[0.04] bg-[#07070e] overflow-y-auto p-4 space-y-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2">Syllabus Index</h3>
            
            {course.modules?.map((mod: any) => (
              <div key={mod.id} className="space-y-2">
                <h4 className="text-xs font-bold text-white px-2 py-1 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  {mod.title}
                </h4>
                
                <div className="space-y-1">
                  {mod.lessons?.map((les: any) => {
                    const isActive = les.id === activeLessonId;
                    return (
                      <button
                        key={les.id}
                        onClick={() => setActiveLessonId(les.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex justify-between items-center transition-all cursor-pointer ${
                          isActive 
                            ? "bg-purple-600/20 border border-purple-500/30 text-white font-semibold" 
                            : "hover:bg-white/5 border border-transparent text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="truncate max-w-[200px]">{les.title}</span>
                        {les.is_completed ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>

          {/* Core Lecture Workspace */}
          <main className="flex-1 bg-[#090912] overflow-y-auto p-8 relative">
            {lessonLoading ? (
              <div className="absolute inset-0 bg-[#090912]/80 flex flex-col items-center justify-center font-mono text-cyan-400 text-xs">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse mb-3" />
                AI Professor compiling digital chapter...
              </div>
            ) : lessonData ? (
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header title */}
                <div className="flex justify-between items-start border-b border-white/[0.04] pb-4">
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-extrabold text-white">{lessonData.title}</h1>
                    <p className="text-xs text-purple-400 font-mono flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Course Lecture Note
                    </p>
                  </div>
                  
                  {/* Reading Tab selectors */}
                  <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                    {[
                      { id: "lecture", label: "Lecture Notes" },
                      { id: "textbook", label: "Deep Textbook" },
                      { id: "flashcards", label: "Flashcards" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          activeTab === tab.id 
                            ? "bg-purple-600 text-white" 
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content workspace */}
                <div className="py-4">
                  
                  {/* Lecture Notes tab — rendered Markdown */}
                  {activeTab === "lecture" && (
                    <MarkdownRenderer content={lessonData.content || ""} />
                  )}

                  {/* Textbook tab — rendered Markdown */}
                  {activeTab === "textbook" && (
                    <div className="bg-[#0b0b14] border border-white/[0.05] p-8 rounded-xl">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Bookmark className="h-4 w-4" /> NOVA ACADEMIC REPOSITORY
                        </span>
                        <span>ISBN-978-NOVA-2026</span>
                      </div>
                      <MarkdownRenderer content={lessonData.textbook_chapter || ""} />
                    </div>
                  )}

                  {/* Flashcards tab — 3D flip animation */}
                  {activeTab === "flashcards" && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-6">
                      {flashcards.length === 0 ? (
                        <p className="text-sm text-gray-500">No revision cards found for this lesson.</p>
                      ) : (
                        <div className="w-full max-w-lg">
                          <p className="text-center text-xs text-gray-500 mb-5 flex items-center justify-center gap-1">
                            <Keyboard className="h-3.5 w-3.5" />
                            Space to flip · ← → to navigate
                          </p>

                          {/* 3D Flip Card */}
                          <div
                            onClick={() => setCardFlipped(f => !f)}
                            className="cursor-pointer w-full"
                            style={{ perspective: "1200px" }}
                          >
                            <div
                              style={{
                                transformStyle: "preserve-3d",
                                transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
                                transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                                position: "relative",
                                minHeight: "220px",
                              }}
                            >
                              {/* Front face — Question */}
                              <div
                                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                                className="absolute inset-0 bg-gradient-to-br from-purple-950/60 to-[#0f0f1c] border border-purple-500/30 rounded-2xl p-8 flex flex-col justify-between shadow-2xl"
                              >
                                <span className="text-[10px] text-purple-400 font-mono font-bold uppercase tracking-widest">Question</span>
                                <p className="text-base text-white font-semibold text-center leading-relaxed px-2">
                                  {flashcards[cardIndex]?.question}
                                </p>
                                <span className="text-[10px] text-gray-600 font-mono text-center">Click or press Space to reveal answer</span>
                              </div>

                              {/* Back face — Answer */}
                              <div
                                style={{
                                  backfaceVisibility: "hidden",
                                  WebkitBackfaceVisibility: "hidden",
                                  transform: "rotateY(180deg)",
                                }}
                                className="absolute inset-0 bg-gradient-to-br from-cyan-950/60 to-[#0f0f1c] border border-cyan-500/30 rounded-2xl p-8 flex flex-col justify-between shadow-2xl"
                              >
                                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-widest">Answer</span>
                                <p className="text-base text-cyan-100 font-semibold text-center leading-relaxed px-2">
                                  {flashcards[cardIndex]?.answer}
                                </p>
                                <span className="text-[10px] text-gray-600 font-mono text-center">Press → for next card</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress dots + nav */}
                          <div className="flex justify-between items-center mt-6">
                            <button
                              disabled={cardIndex === 0}
                              onClick={() => { setCardIndex(i => i - 1); setCardFlipped(false); }}
                              className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-gray-300 disabled:opacity-30 cursor-pointer text-xs hover:bg-white/10 transition-all"
                            >
                              ← Prev
                            </button>
                            <div className="flex gap-1.5">
                              {flashcards.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => { setCardIndex(i); setCardFlipped(false); }}
                                  className={`h-2 rounded-full transition-all cursor-pointer ${
                                    i === cardIndex ? "w-6 bg-purple-400" : "w-2 bg-white/20 hover:bg-white/40"
                                  }`}
                                />
                              ))}
                            </div>
                            <button
                              disabled={cardIndex === flashcards.length - 1}
                              onClick={() => { setCardIndex(i => i + 1); setCardFlipped(false); }}
                              className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-gray-300 disabled:opacity-30 cursor-pointer text-xs hover:bg-white/10 transition-all"
                            >
                              Next →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Footer Complete Actions */}
                <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Mastered this topic? Proceed to test your skills:</span>
                    <button
                      onClick={() => router.push(`/exams?lesson_id=${activeLessonId}`)}
                      className="text-xs text-cyan-400 font-semibold hover:underline"
                    >
                      Take Quiz Assessment &rarr;
                    </button>
                  </div>
                  
                  <button
                    onClick={handleCompleteLesson}
                    disabled={lessonData.is_completed}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
                      lessonData.is_completed 
                        ? "bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 cursor-default" 
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/10"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{lessonData.is_completed ? "Lesson Completed" : "Mark as Completed (+25 XP)"}</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-sm text-gray-500">
                Please select a lesson from the syllabus index to begin reading.
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
