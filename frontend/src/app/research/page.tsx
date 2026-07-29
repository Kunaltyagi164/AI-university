"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useToast } from "@/components/ToastProvider";
import { 
  FlaskConical, 
  Sparkles, 
  Send, 
  BookOpen, 
  FileText, 
  Quote,
  Layers,
  Copy,
  Check,
  Download
} from "lucide-react";

export default function ResearchPage() {
  const { addToast } = useToast();
  const [topic, setTopic] = useState("");
  const [action, setAction] = useState("outline");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string>("");
  const [citations, setCitations] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) { setError("Please specify a research topic."); return; }
    setError("");
    setLoading(true);
    setResults("");
    setCitations([]);

    try {
      const res = await api.queryResearch({ topic, action, context });
      setResults(res.result);
      setCitations(res.citations || []);
      
      const savedProfile = localStorage.getItem("nova_profile");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        profile.xp += 10;
        localStorage.setItem("nova_profile", JSON.stringify(profile));
      }
      addToast({ type: "xp", title: "+10 XP — Research compiled!", message: `Generated ${action.replace("_", " ")} for "${topic}"` });
    } catch (err: any) {
      setError(err.message || "Failed to generate research schema.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([results], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 40).replace(/\s+/g, "_")}_${action}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Research Console */}
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-pink-400" /> Research Lab
            </h2>
            <p className="text-xs text-gray-400 font-mono">AI Research & Citations Assistant</p>
          </div>
          <div className="text-xs text-pink-400 font-mono bg-pink-950/20 border border-pink-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> CITATIONS ENGINE ACTIVE
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-sm rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Input Forms and Configurations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Settings Panel */}
          <div className="lg:col-span-5">
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-pink-500" />
              
              <h3 className="text-base font-bold text-white">Scoping Parameters</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Research Topic</label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 text-xs transition-all"
                    placeholder="e.g. Distributed Consensus in IoT Networks..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace Action</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: "outline", label: "Generate Paper Outline", icon: FileText },
                      { id: "citations", label: "Find Bibliography Citations", icon: Quote },
                      { id: "literature_review", label: "Draft Literature Review", icon: Layers }
                    ].map((act) => {
                      const Icon = act.icon;
                      return (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => setAction(act.id)}
                          className={`px-4 py-3 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
                            action === act.id 
                              ? "bg-pink-600/20 border-pink-500 text-white shadow-[0_0_8px_rgba(217,70,239,0.1)]" 
                              : "bg-white/5 border-white/5 hover:border-white/10 text-gray-300 hover:text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{act.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Additional Context / Instructions</label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 text-xs transition-all h-24 resize-none"
                    placeholder="Provide specific guidelines, math notations, or structural limits..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-pink-500/15"
                >
                  <span>{loading ? "Compiling Paper Schema..." : "Analyze & Generate"}</span>
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Results Workspace Console */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Output editor */}
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-pink-400" /> Compiled Draft
                </h3>
                {results && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-all cursor-pointer"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600/20 border border-pink-500/30 hover:bg-pink-600/30 rounded-lg text-xs text-pink-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download .md
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-full" />
                    <div className="h-4 bg-white/5 rounded w-5/6" />
                    <div className="h-4 bg-white/5 rounded w-2/3" />
                    <div className="h-4 bg-white/5 rounded w-full" />
                    <p className="text-xs font-mono text-pink-400 animate-pulse mt-4">Scanning citation indexes and formatting structures...</p>
                  </div>
                ) : results ? (
                  <MarkdownRenderer content={results} />
                ) : (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Configure parameters and click "Analyze &amp; Generate" to retrieve research output.
                  </p>
                )}
              </div>

              <div className="text-[10px] text-gray-600 border-t border-white/[0.04] pt-3 mt-4 text-center font-mono">
                Double-check all citations before submitting academic work.
              </div>
            </div>

            {/* Citations index lists */}
            {citations.length > 0 && (
              <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-cyan-400" /> Suggested Citations Bibliography
                </h3>
                <div className="space-y-3">
                  {citations.map((cit, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-cyan-400 font-semibold font-mono text-[10px]">
                        <span>{cit.author} ({cit.year})</span>
                        <span>{cit.venue}</span>
                      </div>
                      <p className="text-gray-300 font-sans font-medium">{cit.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
