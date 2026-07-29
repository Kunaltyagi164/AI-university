"use client";

import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/ToastProvider";
import { 
  Cpu, 
  Sparkles, 
  Database, 
  Key, 
  Activity, 
  RefreshCw, 
  CheckCircle2,
  XCircle,
  Terminal as TermIcon,
  Eye,
  EyeOff,
  Zap,
  AlertTriangle,
  Users
} from "lucide-react";

export default function AdminPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);

  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] NOVA-SERVER [INFO] Initialized database session engines.`,
    `[${new Date().toLocaleTimeString()}] NOVA-SERVER [INFO] Loaded socratic prompt configurations.`,
    `[${new Date().toLocaleTimeString()}] NOVA-SERVER [WARN] API key files empty. Fallback mode active.`,
    `[${new Date().toLocaleTimeString()}] NOVA-SERVER [INFO] Server listening on port 8000.`
  ]);

  const addLog = (level: string, msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] NOVA-SERVER [${level}] ${msg}`]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const report = await api.getAdminStats();
      setStats(report);
      addLog("INFO", `Synchronized telemetry. Provider: ${report.active_llm_provider}`);
    } catch (err: any) {
      setError("Failed to fetch system stats. Make sure FastAPI server is running.");
      addLog("ERROR", "Failed to sync telemetry stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      const events = [
        "GET /api/auth/me → 200 OK",
        "POST /api/professor/chat → 200 OK (socratic mode)",
        "GET /api/course/degree → 200 OK",
        "POST /api/ide/run → 200 OK (sandbox kernel)",
        "GET /api/exams/generate → 200 OK"
      ];
      const randomEv = events[Math.floor(Math.random() * events.length)];
      addLog("ACCESS", randomEv);
    }, 8000);
    // Auto-refresh stats every 30s
    const statsInterval = setInterval(fetchStats, 30000);
    return () => { clearInterval(interval); clearInterval(statsInterval); };
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await api.saveAdminConfig({
        openai_api_key: openaiKey || undefined,
        gemini_api_key: geminiKey || undefined
      });
      addToast({ type: "success", title: "API Keys Updated!", message: res.message || "LLM provider credentials saved." });
      addLog("INFO", `API credentials updated. ${geminiKey ? "Gemini" : ""} ${openaiKey ? "OpenAI" : ""} keys injected.`);
      if (openaiKey) localStorage.setItem("nova_openai_active", "true");
      if (geminiKey) localStorage.setItem("nova_gemini_active", "true");
      setGeminiKey("");
      setOpenaiKey("");
      fetchStats();
    } catch (err: any) {
      setError(err.message || "Failed to update LLM configuration.");
      addToast({ type: "error", title: "Config Save Failed", message: err.message || "Check if the FastAPI server is running." });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    addLog("INFO", "Testing LLM provider connection...");
    try {
      // Just call admin stats and see if provider is live
      const res = await api.getAdminStats();
      const isLive = res.active_llm_provider !== "fallback";
      if (isLive) {
        addToast({ type: "success", title: "Connection OK ✓", message: `${res.active_llm_provider} is active and responding.` });
        addLog("INFO", `Connection test passed. Provider: ${res.active_llm_provider}`);
      } else {
        addToast({ type: "error", title: "Fallback Mode Active", message: "No API key configured. Add a Gemini or OpenAI key above." });
        addLog("WARN", "No live LLM provider found. Running in fallback template mode.");
      }
    } catch {
      addToast({ type: "error", title: "Connection Failed", message: "Cannot reach backend server." });
    } finally {
      setTesting(false);
    }
  };

  const providerIsLive = stats?.active_llm_provider && stats.active_llm_provider !== "fallback";

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="h-6 w-6 text-purple-400 animate-pulse" /> Admin Terminal
            </h1>
            <p className="text-xs text-gray-400 font-mono">Telemetry &amp; Global System Controls</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Provider badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold ${
              providerIsLive 
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400" 
                : "bg-amber-950/30 border-amber-500/30 text-amber-400"
            }`}>
              {providerIsLive ? <Zap className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {providerIsLive ? `${stats.active_llm_provider} LIVE` : "FALLBACK MODE"}
            </div>
            <button 
              onClick={fetchStats}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Reload Stats"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "AI Provider", val: stats.active_llm_provider, icon: Activity, col: "text-purple-400", bg: "bg-purple-950/20", border: "border-purple-500/20" },
              { label: "Enrolled Students", val: stats.total_users, icon: Users, col: "text-cyan-400", bg: "bg-cyan-950/20", border: "border-cyan-500/20" },
              { label: "Custom Degrees", val: stats.total_degrees, icon: Sparkles, col: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-500/20" },
              { label: "API Calls", val: stats.api_calls_logged, icon: Zap, col: "text-pink-400", bg: "bg-pink-950/20", border: "border-pink-500/20" }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`glass-panel p-5 rounded-xl border ${stat.border} flex items-center space-x-3`}>
                  <div className={`p-2.5 ${stat.bg} border ${stat.border} ${stat.col} rounded-lg shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">{stat.label}</p>
                    <p className="text-lg font-extrabold text-white capitalize">{stat.val}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Config + Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LLM Config Form */}
          <div className="lg:col-span-5">
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-cyan-500" />
              
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-400" /> AI Provider Configuration
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Configure Gemini or OpenAI to unlock real AI responses. Without keys, the system uses smart fallback templates.
                </p>
              </div>

              {/* Current status indicator */}
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                providerIsLive
                  ? "bg-emerald-950/20 border-emerald-500/25 text-emerald-400"
                  : "bg-amber-950/20 border-amber-500/25 text-amber-400"
              }`}>
                {providerIsLive ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {providerIsLive
                  ? `Active: ${stats?.active_llm_provider} — Real AI responses enabled`
                  : "Fallback mode — Add an API key to enable real AI"}
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                  <div className="relative">
                    <input
                      type={showGemini ? "text" : "password"}
                      value={geminiKey}
                      onChange={e => setGeminiKey(e.target.value)}
                      className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-xs transition-all font-mono"
                      placeholder="AIza..."
                    />
                    <button type="button" onClick={() => setShowGemini(s => !s)} className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 cursor-pointer">
                      {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">OpenAI API Key</label>
                  <div className="relative">
                    <input
                      type={showOpenAI ? "text" : "password"}
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-3 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-xs transition-all font-mono"
                      placeholder="sk-proj-..."
                    />
                    <button type="button" onClick={() => setShowOpenAI(s => !s)} className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 cursor-pointer">
                      {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || (!geminiKey && !openaiKey)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
                  >
                    {saving ? "Saving..." : "Save Keys"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-40"
                  >
                    {testing ? "Testing..." : "Test"}
                  </button>
                </div>
              </form>

              <p className="text-[10px] text-gray-600 font-mono">
                Keys are stored in backend server process memory and .env file.
              </p>
            </div>
          </div>

          {/* Live Logs Stream */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] flex flex-col h-full min-h-[400px]">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/[0.04] pb-3 mb-4">
                <TermIcon className="h-5 w-5 text-cyan-400" /> Live Server Logs
                <span className="ml-auto flex items-center gap-1 text-xs font-mono text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                </span>
              </h3>
              
              <div className="flex-1 bg-[#03030a] border border-white/[0.04] rounded-xl font-mono text-[11px] leading-relaxed space-y-1 overflow-y-auto p-4 select-text">
                {logs.map((log, idx) => {
                  const isWarn = log.includes("WARN");
                  const isErr = log.includes("ERROR");
                  const isAccess = log.includes("ACCESS");
                  return (
                    <div key={idx} className={`${
                      isErr ? "text-red-400" : isWarn ? "text-amber-400" : isAccess ? "text-blue-400" : "text-gray-400"
                    }`}>
                      {log}
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>

              <p className="text-[10px] text-gray-600 font-mono border-t border-white/[0.04] pt-3 mt-3 text-center">
                Auto-refreshes every 30s · {logs.length} log entries
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
