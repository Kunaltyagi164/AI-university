"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/ToastProvider";
import { 
  Award, 
  HelpCircle, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Clock
} from "lucide-react";

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("lesson_id");
  const lessonId = lessonIdParam ? parseInt(lessonIdParam) : 1;
  const { addToast } = useToast();

  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<any>(null);

  // Timer — 10 minutes
  const [timeRemaining, setTimeRemaining] = useState(600);

  useEffect(() => {
    // Check if token exists
    const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
    if (!token) {
      router.push("/");
      return;
    }

    const fetchExam = async () => {
      try {
        const examData = await api.getExam(lessonId);
        setExam(examData);
      } catch (err: any) {
        setError(err.message || "Failed to compile exam questions. Start onboarding first.");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [lessonId, router]);

  // Timer countdown
  useEffect(() => {
    if (exam && !feedback && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, feedback, timeRemaining]);

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const report = await api.submitExam(exam.id, { answers });
      setFeedback(report);

      // Update local profile
      const savedProfile = localStorage.getItem("nova_profile");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        profile.xp = profile.xp + report.xp_gained;
        profile.level = Math.floor(profile.xp / 100) + 1;
        profile.coins = profile.coins + report.coins_gained;
        localStorage.setItem("nova_profile", JSON.stringify(profile));
      }

      // Fire result toasts
      if (report.passed) {
        addToast({ type: "success", title: "Exam Passed! ✓", message: `Score: ${Math.round(report.score)}% — Well done!` });
        setTimeout(() => addToast({ type: "xp", title: `+${report.xp_gained} XP & +${report.coins_gained} Coins`, message: "Added to your academic profile." }), 600);
      } else {
        addToast({ type: "error", title: "Exam Not Passed", message: `Score: ${Math.round(report.score)}% — Review the feedback and retry.`, duration: 5000 });
        addToast({ type: "xp", title: `+${report.xp_gained} XP earned`, message: "Keep practicing to improve your score.", duration: 4000 });
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit exam. Check endpoint.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse mr-2" />
        Compiling assessment questionnaire...
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="min-h-screen bg-[#06060c] flex flex-col items-center justify-center text-center p-4">
        <p className="text-red-400 mb-4">⚠️ {error}</p>
        <button 
          onClick={() => router.push("/dashboard")}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs cursor-pointer transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-8">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-purple-400" /> Examination Hall
            </h2>
            <p className="text-xs text-gray-400 font-mono">NOVA Evaluation Systems</p>
          </div>

          {!feedback && (
            <div className="flex items-center gap-4 text-xs font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 px-3 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5 animate-spin" /> Time Left: {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Proctor alarm bar */}
        {!feedback && (
          <div className="bg-yellow-950/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-yellow-500 animate-bounce" />
            <div className="text-xs text-gray-400">
              <span className="text-yellow-400 font-semibold uppercase font-mono">PROCTOR SENSOR ENABLED:</span> Keep this page in focus. tab changes or exits are logged.
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-sm rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Exam review result screen */}
        {feedback ? (
          <div className="space-y-8">
            {/* Scorecard Widget */}
            <div className="glass-panel p-8 rounded-2xl border border-white/[0.06] text-center space-y-4">
              <span className="text-xs text-purple-400 font-mono font-bold uppercase tracking-widest">ASSESSMENT FINISHED</span>
              
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                {Math.round(feedback.score)}% Score
              </div>

              <p className="text-sm text-gray-400 max-w-md mx-auto">
                {feedback.passed 
                  ? `Congratulations! You passed the assessment and unlocked new credit hours (+${feedback.xp_gained} XP, +${feedback.coins_gained} Coins).` 
                  : "You did not achieve the 70% threshold. Review the explanations below and trigger a re-take assessment."}
              </p>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  Return to Dashboard
                </button>
                {!feedback.passed && (
                  <button
                    onClick={() => {
                      setFeedback(null);
                      setAnswers({});
                      setTimeRemaining(600);
                    }}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                  >
                    Re-take Assessment
                  </button>
                )}
              </div>
            </div>

            {/* Individual Review cards */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Correction Checklist</h3>
              {exam.questions.map((q: any) => {
                const report = feedback.detailed_feedback[q.id] || { correct: false, explanation: "Unresolved" };
                return (
                  <div 
                    key={q.id}
                    className={`glass-panel p-6 rounded-xl border space-y-3 ${
                      report.correct ? "border-emerald-500/20" : "border-red-500/20"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-white max-w-xl">{q.question_text}</h4>
                      {report.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                      )}
                    </div>

                    <div className="text-xs text-gray-500 font-mono space-y-1">
                      <p>Your Answer: <span className={report.correct ? "text-emerald-400" : "text-red-400"}>'{answers[q.id] || "No Answer"}'</span></p>
                      {!report.correct && <p>Correct Answer: <span className="text-gray-300">'{q.correct_answer}'</span></p>}
                    </div>

                    <div className="bg-[#0c0c16] border border-white/5 p-4 rounded-lg text-xs text-gray-400 leading-relaxed font-sans">
                      {report.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Question Sheets Form */
          <form onSubmit={handleSubmitExam} className="space-y-8">
            <div className="space-y-6">
              {exam.questions?.map((q: any, qIdx: number) => (
                <div key={q.id} className="glass-panel p-6 rounded-xl border border-white/[0.04] space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-mono">
                      Q{qIdx + 1}
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-relaxed">{q.question_text}</h3>
                  </div>

                  {q.question_type === "mcq" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                      {q.options?.map((opt: string) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`px-4 py-3 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer ${
                              isSelected 
                                ? "bg-purple-600/25 border-purple-500 text-white shadow-[0_0_8px_rgba(139,92,246,0.1)]" 
                                : "bg-white/5 border-white/5 hover:border-white/10 text-gray-300 hover:text-white"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pl-8">
                      <input
                        type="text"
                        value={answers[q.id] || ""}
                        onChange={(e) => handleSelectOption(q.id, e.target.value)}
                        className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-xs transition-all"
                        placeholder="Type the exact single-word or keyword answer..."
                        required
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/[0.04]">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-purple-500/10 active:translate-y-[1px] transition-all disabled:opacity-50"
              >
                <span>{submitting ? "Evaluating Answers..." : "Submit Examination Sheet"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

      </main>
    </div>
  );
}

export default function ExamsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse mr-2" />
        Bootstrapping Examination Portal...
      </div>
    }>
      <ExamContent />
    </Suspense>
  );
}
