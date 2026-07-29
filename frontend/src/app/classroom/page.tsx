"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useToast } from "@/components/ToastProvider";
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  Brain,
  Copy,
  Check,
  Trash2,
  MessageSquare
} from "lucide-react";

export default function ClassroomPage() {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<any[]>([
    { 
      role: "assistant", 
      content: "Hello! I am your AI Professor. What software paradigms, algorithms, or coding challenges would you like to explore today? Tell me, and we'll investigate socratically.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [personality, setPersonality] = useState("Professor Albert");
  const [classNotes, setClassNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // Voice settings
  const [isListening, setIsListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech API references
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Configure speech recognition (Web Speech API) on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";
        
        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMsg(transcript);
        };
        rec.onerror = () => setIsListening(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleCopy = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(idx);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleClearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared. What would you like to explore?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);
    setClassNotes("");
  };

  const speakText = (text: string) => {
    if (!voiceOutput || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    if (personality === "Athena") {
      const femaleVoice = voices.find(v => v.name.includes("Zira") || v.name.includes("Google US English") || v.lang.startsWith("en-GB"));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 1.05;
    } else if (personality === "Lex") {
      const maleVoice = voices.find(v => v.name.includes("David") || v.name.includes("Microsoft David") || v.name.includes("male"));
      if (maleVoice) utterance.voice = maleVoice;
      utterance.rate = 1.1;
    } else {
      const warmVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Natural") || v.lang.startsWith("en"));
      if (warmVoice) utterance.voice = warmVoice;
      utterance.rate = 0.95;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;

    const userMessage = inputMsg;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInputMsg("");
    setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp }]);
    setLoading(true);

    const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await api.chatProfessor({
        message: userMessage,
        personality,
        history: chatHistory
      });

      const aiTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, { role: "assistant", content: res.response, timestamp: aiTimestamp }]);
      if (res.notes) setClassNotes(res.notes);
      speakText(res.response);
    } catch (e: any) {
      const errTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error connecting to AI Professor. Check API configuration in Admin settings.", timestamp: errTimestamp }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Classroom Panel */}
      <main className="flex-1 flex overflow-hidden h-screen">
        
        {/* Chat window column */}
        <section className="flex-1 flex flex-col justify-between bg-[#07070e] relative h-full">
          
          {/* Header Panel */}
          <div className="h-16 border-b border-white/[0.04] bg-[#090914] px-6 flex justify-between items-center z-10">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400">
                <Brain className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Live AI Classroom</h2>
                <p className="text-xs text-gray-400 font-mono">{messages.length - 1} messages &bull; {personality}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-semibold font-mono uppercase">Teacher:</span>
              <select
                value={personality}
                onChange={(e) => { setPersonality(e.target.value); window.speechSynthesis.cancel(); }}
                className="bg-[#0b0b14] border border-white/10 rounded-lg text-xs text-white px-2 py-1 focus:outline-none"
              >
                <option value="Professor Albert">Albert (Socratic)</option>
                <option value="Athena">Athena (Analytical)</option>
                <option value="Lex">Lex (Practical)</option>
              </select>
              
              <button
                onClick={() => { setVoiceOutput(!voiceOutput); if (voiceOutput) window.speechSynthesis.cancel(); }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  voiceOutput ? "bg-purple-600/20 border-purple-500/30 text-purple-400" : "bg-white/5 border-white/5 text-gray-500"
                }`}
                title={voiceOutput ? "Voice on" : "Voice off"}
              >
                {voiceOutput ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dialogue Board */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} gap-1`}>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
                    {m.role === "user" ? "You" : personality}
                  </span>
                  {m.timestamp && <span className="text-[10px] text-gray-700 font-mono">{m.timestamp}</span>}
                </div>
                <div className="relative group max-w-2xl">
                  <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-purple-600 border border-purple-500/30 text-white rounded-br-none"
                      : "bg-[#0c0c16] border border-white/[0.06] text-gray-300 rounded-bl-none shadow-md"
                  }`}>
                    {m.role === "assistant" ? (
                      <MarkdownRenderer content={m.content} />
                    ) : (
                      <p>{m.content}</p>
                    )}
                  </div>
                  {m.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                      title="Copy message"
                    >
                      {copiedId === idx ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="bg-[#0c0c16] border border-white/[0.06] px-5 py-4 rounded-xl rounded-bl-none">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Speech Waveform interface */}
          {isListening && (
            <div className="h-20 bg-cyan-950/20 border-t border-cyan-500/20 flex items-center justify-center gap-1">
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
            </div>
          )}

          {/* Interactive Chat Form Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.04] bg-[#090914] flex gap-3">
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isListening 
                  ? "bg-red-600/20 border-red-500 text-red-400 animate-pulse" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
              title={isListening ? "Listening... click to stop" : "Speak to Professor"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-[#05050a] border border-white/10 rounded-lg px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
              placeholder={isListening ? "Listening... speak clearly" : "Ask about event streams, DB isolation, algorithms..."}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>

        </section>

        {/* Real-time Notebook sidebar */}
        <aside className="w-80 border-l border-white/[0.04] bg-[#090914] p-5 flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Lecture Notebook</h3>
            </div>
            {classNotes && (
              <button
                onClick={() => handleCopy(classNotes, -1)}
                className="p-1.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all cursor-pointer"
                title="Copy notes"
              >
                {copiedId === -1 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
          
          <div className="flex-1 bg-[#05050c] border border-white/[0.04] rounded-xl p-4 overflow-y-auto">
            {classNotes ? (
              <MarkdownRenderer content={classNotes} />
            ) : (
              <p className="text-xs text-gray-600 font-mono italic">Class notes will auto-compile as you discuss topics with your professor.</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-gray-600" />
            <p className="text-[10px] text-gray-600 font-mono">Notes auto-compile during the session.</p>
          </div>
        </aside>

      </main>
    </div>
  );
}
