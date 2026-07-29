"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import {
  Award,
  Download,
  Share2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Star,
  Shield,
} from "lucide-react";

interface CertificateData {
  certificate_id: string;
  student_name: string;
  student_email: string;
  course_title: string;
  course_code: string;
  course_credits: number;
  degree_title: string;
  issued_date: string;
  difficulty: string;
}

function CertificateCard({ data }: { data: CertificateData }) {
  return (
    <div
      id="certificate-card"
      className="relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40"
      style={{
        background: "linear-gradient(135deg, #0d0b1e 0%, #0a0c22 40%, #07111e 100%)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
      }}
    >
      {/* Top gradient accent bar */}
      <div
        className="h-2 w-full"
        style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899, #06b6d4, #8b5cf6)" }}
      />

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-purple-500/30 rounded-tl-xl" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-xl" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-xl" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-purple-500/30 rounded-br-xl" />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative p-12 text-center space-y-6">
        {/* University crest */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/30" />
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-purple-400/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
        </div>

        {/* Institution header */}
        <div className="space-y-1">
          <p className="text-[10px] text-purple-300/80 font-mono uppercase tracking-[0.25em]">
            Nova AI University
          </p>
          <p className="text-[10px] text-gray-500 font-mono tracking-widest">
            CERTIFICATE OF COMPLETION
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          <Star className="h-3 w-3 text-amber-400" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        </div>

        {/* Main certificate text */}
        <div className="space-y-4">
          <p className="text-sm text-gray-400 italic">This certifies that</p>
          <h1
            className="text-4xl font-extrabold text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #e2d9ff, #c4b5fd, #a78bfa)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            {data.student_name}
          </h1>
          <p className="text-sm text-gray-400">has successfully completed the course</p>
          <div className="inline-block px-6 py-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
            <p
              className="text-2xl font-bold text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, #67e8f9, #a78bfa)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              {data.course_title}
            </p>
            <p className="text-xs text-gray-500 font-mono mt-1">
              {data.course_code} · {data.course_credits} Credit Hours · {data.difficulty}
            </p>
          </div>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            as part of the degree program in{" "}
            <span className="text-purple-300 font-medium">{data.degree_title}</span>
          </p>
        </div>

        {/* Second divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <Shield className="h-3 w-3 text-cyan-400" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>

        {/* Footer metadata */}
        <div className="flex justify-between items-end text-xs font-mono text-gray-500">
          <div className="text-left space-y-1">
            <p className="text-gray-400 font-semibold">Professor Albert, Dean of AI</p>
            <div className="w-28 h-px bg-gray-600" />
            <p>Digital Signature</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-purple-400 font-bold text-sm">{data.issued_date}</p>
            <p>Date of Issue</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-cyan-400 font-bold text-[10px] break-all max-w-[140px]">{data.certificate_id}</p>
            <p>Certificate ID</p>
          </div>
        </div>
      </div>

      {/* Bottom gradient accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)" }}
      />
    </div>
  );
}

export default function CertificatePage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);

  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
    if (!token) { router.push("/"); return; }

    const fetchCert = async () => {
      try {
        const data = await api.getCertificate(courseId);
        setCert(data);
      } catch (err: any) {
        setError(err.message || "Certificate not available. Complete the course first.");
      } finally {
        setLoading(false);
      }
    };

    fetchCert();
  }, [courseId, router]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const el = document.getElementById("certificate-card");
      if (!el) return;

      // Use browser print dialog targeting just the certificate card
      const printContent = el.outerHTML;
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>NOVA Certificate — ${cert?.student_name}</title>
            <style>
              body { margin: 0; padding: 20px; background: #06060c; display: flex; justify-content: center; }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      win.document.close();
      setTimeout(() => { win.print(); }, 400);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setCopying(true);
    const url = `${window.location.origin}/certificate/${courseId}`;
    try {
      await navigator.clipboard.writeText(url);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse mr-2" />
        Generating certificate...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <div className="border-b border-white/[0.04] bg-[#080810] px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                Course Certificate
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Official NOVA AI University credential</p>
            </div>
          </div>

          {cert && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium cursor-pointer transition-all"
              >
                <Share2 className="h-3.5 w-3.5" />
                {copying ? "Link Copied! ✓" : "Share"}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-lg disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {downloading ? "Preparing..." : "Print / Save"}
              </button>
            </div>
          )}
        </div>

        <div className="p-8 max-w-4xl mx-auto space-y-8">

          {error && (
            <div className="p-6 bg-red-950/20 border border-red-500/30 text-red-400 text-sm rounded-2xl text-center space-y-3">
              <p className="font-semibold">⚠️ {error}</p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-all"
              >
                Go Back
              </button>
            </div>
          )}

          {cert && (
            <>
              {/* Achievement Banner */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-amber-950/20 to-yellow-950/10 border border-amber-500/20 p-5 rounded-2xl">
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    Course Completed <Sparkles className="h-4 w-4 text-amber-400" />
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your official certificate is below. Download it to share your achievement.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400 font-mono">{cert.issued_date}</p>
                  <p className="text-xs text-amber-400 font-mono mt-0.5">{cert.certificate_id}</p>
                </div>
              </div>

              {/* The Certificate */}
              <CertificateCard data={cert} />

              {/* Details below */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Student", value: cert.student_name, color: "text-purple-400" },
                  { label: "Course Code", value: cert.course_code, color: "text-cyan-400" },
                  { label: "Credits Earned", value: `${cert.course_credits} Credits`, color: "text-emerald-400" },
                  { label: "Difficulty", value: cert.difficulty, color: "text-amber-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="glass-panel p-4 rounded-xl border border-white/[0.06] space-y-1">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
