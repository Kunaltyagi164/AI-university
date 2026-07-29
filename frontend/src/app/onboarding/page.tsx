"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Sparkles, 
  Target, 
  Wrench, 
  Gauge, 
  Languages, 
  MessageSquare, 
  ArrowRight, 
  GraduationCap
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  
  // Quiz variables
  const [step, setStep] = useState(1);
  const [careerGoal, setCareerGoal] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [learningSpeed, setLearningSpeed] = useState("normal");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [preferredTeachingStyle, setPreferredTeachingStyle] = useState("socratic");
  const [availableHours, setAvailableHours] = useState(2.0);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");

  const loadingMessages = [
    "Analyzing career trajectories...",
    "Compiling custom course syllabus modules...",
    "Caching deep interactive textbooks...",
    "Structuring AI Professor Albert's memory networks...",
    "Finalizing digital student credential keys..."
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= loadingMessages.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleNext = () => {
    if (step === 1 && !careerGoal.trim()) {
      setError("Please specify your primary career goal.");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleFinish = async () => {
    setError("");
    setLoading(true);
    setLoadingStep(0);

    try {
      // Trigger onboarding API compiling degree roadmap
      const degreeData = await api.submitOnboarding({
        career_goal: careerGoal,
        current_skills: currentSkills,
        learning_speed: learningSpeed,
        preferred_language: preferredLanguage,
        preferred_teaching_style: preferredTeachingStyle,
        available_hours_per_day: availableHours
      });

      // Save degree information and initial profile data locally
      localStorage.setItem("nova_degree", JSON.stringify(degreeData));
      
      const profileData = {
        learning_speed: learningSpeed,
        preferred_language: preferredLanguage,
        preferred_teaching_style: preferredTeachingStyle,
        career_goal: careerGoal,
        current_skills: currentSkills,
        xp: 0,
        coins: 10,
        level: 1,
        streak: 0
      };
      localStorage.setItem("nova_profile", JSON.stringify(profileData));

      // Wait a moment on final message before routing
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Compilation failed. Try refactoring goals.");
    }
  };

  // Predefined career goals
  const goalsTemplates = [
    "Become a Senior Machine Learning Engineer",
    "Become a Cloud Infrastructure Architect",
    "Become an Enterprise Full Stack Developer",
    "Become a Cybersecurity & Threat Analysis Specialist",
    "Become a Distributed Systems Optimization Engineer"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-md space-y-8">
          {/* Hologram loading loop */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-cyan-500/20 border-b-cyan-500 animate-spin" style={{ animationDirection: "reverse" }} />
            <div className="absolute inset-4 rounded-full bg-purple-950/20 flex items-center justify-center text-purple-400">
              <GraduationCap className="h-10 w-10 animate-bounce" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-wide">NOVA Degree Compiler</h2>
            <div className="h-6 overflow-hidden">
              <p className="text-cyan-400 font-mono text-sm animate-pulse">
                {loadingMessages[loadingStep]}
              </p>
            </div>
          </div>

          <div className="w-full bg-[#0a0a14] h-2 rounded-full border border-white/5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="max-w-2xl mx-auto w-full text-center space-y-2">
        <div className="inline-flex p-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 mb-2">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Student Enrollment Portal</h1>
        <p className="text-sm text-gray-400">Configure your parameters to compile a personalized university degree.</p>
      </div>

      {/* Main card */}
      <div className="max-w-2xl mx-auto w-full my-8 glass-panel p-8 rounded-2xl border border-white/[0.06] shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-cyan-500" />
        
        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-sm rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Career Goal */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4">
              <Target className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">What do you want to become?</h3>
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Career Path Target</label>
              <input
                type="text"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                placeholder="e.g. Become a Senior ML Architect..."
              />
              
              <div className="space-y-2">
                <span className="text-xs text-gray-500 font-mono">Quick Selection:</span>
                <div className="flex flex-wrap gap-2">
                  {goalsTemplates.map((goal, i) => (
                    <button
                      key={i}
                      onClick={() => setCareerGoal(goal)}
                      className="text-xs px-3 py-2 bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Experience & Skills */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4">
              <Wrench className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">What experience or skills do you already have?</h3>
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Skill Points</label>
              <textarea
                value={currentSkills}
                onChange={(e) => setCurrentSkills(e.target.value)}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all h-32 resize-none"
                placeholder="e.g. basic python coding, sql queries, html/css, excel sheets (separated by comma)..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Speed and Allocation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4">
              <Gauge className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Learning speed and time commitment</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Learning Velocity</label>
                <div className="flex flex-col gap-2">
                  {["slow", "normal", "fast"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setLearningSpeed(s)}
                      className={`px-4 py-3 text-sm font-semibold rounded-lg border text-left capitalize transition-all cursor-pointer ${
                        learningSpeed === s 
                          ? "bg-purple-600/20 border-purple-500 text-white" 
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {s} Velocity
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Study Commitment (Per Day)</label>
                <div className="p-4 bg-[#0a0a14] border border-white/5 rounded-lg flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl font-extrabold text-cyan-400">{availableHours} Hrs</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">Slide to change hours</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Language & Professor Personalities */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4">
              <Languages className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Lecture Language and Professor Style</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferred Language</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm transition-all"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Teaching Methodology</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "socratic", name: "Socratic (Dialogue & Analogies)" },
                    { id: "practical", name: "Practical (Code & Case-focused)" },
                    { id: "academic", name: "Academic (Formal & Rigorous)" }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setPreferredTeachingStyle(style.id)}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-lg border text-left transition-all cursor-pointer ${
                        preferredTeachingStyle === style.id 
                          ? "bg-purple-600/20 border-purple-500 text-white" 
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 pt-6 border-t border-white/[0.04] flex justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-md"
            >
              <span>Next Step</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-lg hover:shadow-purple-500/10"
            >
              <Sparkles className="h-4 w-4" />
              <span>Compile Degree Roadmap</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Footer */}
      <div className="max-w-2xl mx-auto w-full text-center text-xs text-gray-600">
        Step {step} of 4 &bull; NOVA Curriculum Systems v1.0.0
      </div>
    </div>
  );
}
