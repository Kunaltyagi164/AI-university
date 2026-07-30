"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/ToastProvider";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Check,
  X,
  BookOpen,
  Zap,
  Trophy,
} from "lucide-react";

interface Flashcard {
  question: string;
  answer: string;
}

interface LessonOption {
  id: number;
  title: string;
  courseTitle: string;
}

export default function FlashcardsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Load degree to populate lesson list
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
    if (!token) { router.push("/"); return; }

    const loadLessons = async () => {
      try {
        const degree = await api.getDegree();
        const lessonList: LessonOption[] = [];
        for (const course of degree.courses || []) {
          try {
            const courseDetail = await api.getCourse(course.id);
            for (const mod of courseDetail.modules || []) {
              for (const lesson of mod.lessons || []) {
                lessonList.push({ id: lesson.id, title: lesson.title, courseTitle: course.title });
              }
            }
          } catch { /* skip */ }
        }
        setLessons(lessonList);
      } catch { /* ignore */ }
    };
    loadLessons();
  }, [router]);

  const loadFlashcards = async (lessonId: number) => {
    setLoading(true);
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setSessionComplete(false);
    try {
      const lesson = await api.getFlashcards(lessonId);
      if (lesson.flashcards_json) {
        const parsed: Flashcard[] = JSON.parse(lesson.flashcards_json);
        setCards(parsed);
      } else {
        // Fallback: generate mock cards from lesson title
        setCards([
          { question: `What is the core concept of "${lesson.title}"?`, answer: lesson.summary || "Review the lesson content to find the answer." },
          { question: `Give a real-world application of ${lesson.title}.`, answer: "Think about industry use-cases covered in the lesson." },
        ]);
      }
    } catch {
      addToast({ type: "error" as any, title: "Error", message: "Could not load flashcards for this lesson." });
    } finally {
      setLoading(false);
    }
  };

  const shuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setSessionComplete(false);
  };

  const markKnown = () => {
    const next = new Set(known);
    next.add(currentIndex);
    setKnown(next);
    advance();
  };

  const markUnknown = () => {
    const next = new Set(unknown);
    next.add(currentIndex);
    setUnknown(next);
    advance();
  };

  const advance = () => {
    setFlipped(false);
    if (currentIndex + 1 >= cards.length) {
      setSessionComplete(true);
      // Award XP
      const savedProfile = typeof window !== "undefined" ? localStorage.getItem("nova_profile") : null;
      if (savedProfile) {
        const prof = JSON.parse(savedProfile);
        prof.xp = (prof.xp || 0) + 20;
        localStorage.setItem("nova_profile", JSON.stringify(prof));
      }
      addToast({ type: "xp", title: "+20 XP — Flashcard Session Done!", message: `Reviewed ${cards.length} cards.` });
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setSessionComplete(false);
  };

  const currentCard = cards[currentIndex];
  const progressPct = cards.length > 0 ? Math.round(((known.size + unknown.size) / cards.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/[0.04] bg-[#080810] px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              Flashcard Study Mode
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-1">Spaced-repetition study from your lesson flashcards</p>
          </div>
          {cards.length > 0 && (
            <button
              onClick={shuffle}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-medium cursor-pointer transition-all"
            >
              <Shuffle className="h-3.5 w-3.5" /> Shuffle
            </button>
          )}
        </div>

        <div className="p-8 max-w-3xl mx-auto space-y-6">

          {/* Lesson selector */}
          <div className="glass-panel rounded-xl border border-white/[0.06] p-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 font-mono uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" /> Select a Lesson
            </p>
            {lessons.length === 0 ? (
              <p className="text-xs text-gray-500">Loading your lessons...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {lessons.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setSelectedLessonId(l.id); loadFlashcards(l.id); }}
                    className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      selectedLessonId === l.id
                        ? "border-purple-500/50 bg-purple-950/20 text-white"
                        : "border-white/5 bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/10"
                    }`}
                  >
                    <p className="font-semibold truncate">{l.title}</p>
                    <p className="text-gray-600 truncate mt-0.5">{l.courseTitle}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-16 text-cyan-400 font-mono text-sm">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse mr-2" />
              Loading flashcards...
            </div>
          )}

          {/* Session complete */}
          {sessionComplete && (
            <div className="glass-panel rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-8 text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold text-white">Session Complete!</h2>
              <div className="flex justify-center gap-8 text-sm font-mono">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-emerald-400">{known.size}</p>
                  <p className="text-gray-500">Known</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-red-400">{unknown.size}</p>
                  <p className="text-gray-500">Review</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-amber-400">
                    {cards.length > 0 ? Math.round((known.size / cards.length) * 100) : 0}%
                  </p>
                  <p className="text-gray-500">Score</p>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={restart}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold cursor-pointer transition-all"
                >
                  <RotateCcw className="h-4 w-4" /> Study Again
                </button>
                <button
                  onClick={shuffle}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold cursor-pointer transition-all"
                >
                  <Shuffle className="h-4 w-4" /> Shuffle & Repeat
                </button>
              </div>
            </div>
          )}

          {/* Card area */}
          {!loading && !sessionComplete && cards.length > 0 && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                <span>{currentIndex + 1} / {cards.length}</span>
                <span className="flex items-center gap-3">
                  <span className="text-emerald-400">{known.size} known</span>
                  <span className="text-red-400">{unknown.size} review</span>
                </span>
                <span>{progressPct}% done</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Flashcard — 3D flip */}
              <div
                className="relative h-72 cursor-pointer select-none"
                style={{ perspective: "1200px" }}
                onClick={() => setFlipped(f => !f)}
              >
                <div
                  className="w-full h-full relative"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {/* Front — Question */}
                  <div
                    className="absolute inset-0 glass-panel rounded-2xl border border-white/[0.08] flex flex-col items-center justify-center p-8 text-center"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest mb-4">Question</span>
                    <p className="text-lg font-semibold text-white leading-relaxed">{currentCard.question}</p>
                    <p className="text-xs text-gray-600 mt-6 font-mono">Click to reveal answer</p>
                  </div>

                  {/* Back — Answer */}
                  <div
                    className="absolute inset-0 glass-panel rounded-2xl border border-cyan-500/20 bg-cyan-950/10 flex flex-col items-center justify-center p-8 text-center"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest mb-4">Answer</span>
                    <p className="text-base text-gray-200 leading-relaxed">{currentCard.answer}</p>
                  </div>
                </div>
              </div>

              {/* Know / Don't Know buttons */}
              {flipped && (
                <div className="flex gap-4">
                  <button
                    onClick={markUnknown}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/40 rounded-xl font-semibold text-sm cursor-pointer transition-all"
                  >
                    <X className="h-4 w-4" /> Still Learning
                  </button>
                  <button
                    onClick={markKnown}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40 rounded-xl font-semibold text-sm cursor-pointer transition-all"
                  >
                    <Check className="h-4 w-4" /> Got It!
                  </button>
                </div>
              )}

              {/* Keyboard hint */}
              {!flipped && (
                <div className="flex justify-center gap-6 text-[10px] text-gray-600 font-mono">
                  <span>← Previous</span>
                  <span>Space — Flip</span>
                  <span>Next →</span>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !sessionComplete && cards.length === 0 && selectedLessonId && (
            <div className="text-center py-16 text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No flashcards found for this lesson yet.</p>
              <p className="text-xs mt-1">Flashcards are generated when your AI Professor creates lesson content.</p>
            </div>
          )}

          {!loading && !selectedLessonId && (
            <div className="text-center py-16 text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Select a lesson above to begin studying.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
