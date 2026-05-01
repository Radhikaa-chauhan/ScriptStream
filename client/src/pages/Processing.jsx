import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scan,
  Database,
  ShieldCheck,
  CalendarClock,
  X,
  Pause,
  Clock,
  ChevronRight,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";

const steps = [
  {
    icon: <Scan size={18} />,
    title: "Vision: Reading Image",
    desc: "High-fidelity OCR parsing of handwriting, abbreviations, and clinical shorthand.",
    duration: 3000,
  },
  {
    icon: <Database size={18} />,
    title: "RAG Lookup: Fetching Drug Data",
    desc: "Retrieving real-time pharmacological profiles and contraindications from the DrugDB.",
    duration: 5000,
  },
  {
    icon: <ShieldCheck size={18} />,
    title: "Safety Check: Analyzing Interactions",
    desc: "Cross-referencing prescription with your health history and current medications.",
    duration: 4000,
  },
  {
    icon: <CalendarClock size={18} />,
    title: "Scheduler: Building Adherence Plan",
    desc: "Optimizing dose timing and frequency based on clinical guidelines and lifestyle.",
    duration: 3000,
  },
];

const logLines = [
  { time: "14:22:01", level: "INFO", msg: "Initializing Vision Engine v4.2..." },
  { time: "14:22:03", level: "SUCCESS", msg: "Handwriting segments identified. Confidence 98%." },
  { time: "14:22:04", level: "INFO", msg: "OCR Stream: [Metformin 500mg, Lisinopril 10mg]" },
  { time: "14:22:05", level: "SUCCESS", msg: "Vision Phase Complete. Passing to RAG Pipeline." },
  { time: "14:22:07", level: "INFO", msg: "Querying DrugDB for Metformin HCl (Oral Tablet)..." },
  { time: "14:22:08", level: "INFO", msg: "RAG Result: Match found in Clinical DB (Ref: FDA-2023-X)." },
  { time: "14:22:09", level: "WARN", msg: "Warning: Potential renal function contraindication found in metadata." },
  { time: "14:22:10", level: "INFO", msg: "Fetching drug interaction vectors for Patient #MS-992..." },
  { time: "14:22:12", level: "INFO", msg: "Analyzing node connection: Lisinopril ↔ Metformin..." },
  { time: "14:22:13", level: "INFO", msg: "Processing clinical JSON: { 'interaction_risk': 'low', 'monitor': 'K+' }" },
  { time: "14:22:14", level: "INFO", msg: "Executing Vector Similarity Search for secondary compounds..." },
  { time: "14:22:15", level: "INFO", msg: "Retrieving dosage guidelines for geriatric profile..." },
  { time: "14:22:16", level: "INFO", msg: "→ __PROCESSING_DATA_PACKETS..." },
];

const levelColor = {
  INFO:    "text-blue-400",
  SUCCESS: "text-green-400",
  WARN:    "text-yellow-400",
  WAIT:    "text-purple-400",
  ERROR:   "text-red-400",
};

export default function Processing() {
  const navigate = useNavigate();
  const { prescriptionId, setAnalysisResult } = useApp();
  const { user } = useAuth();
  const { status: socketStatus, progress: socketProgress, logs: socketLogs, result: socketResult } = useSocket(prescriptionId);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState([]);
  const [etaSeconds, setEtaSeconds] = useState(14);
  const [paused, setPaused] = useState(false);
  const logRef = useRef(null);
  const pausedRef = useRef(false);

  // When socket completes, save result and navigate
  useEffect(() => {
    if (socketStatus === "completed" && socketResult) {
      setAnalysisResult(socketResult);
      navigate("/results");
    }
  }, [socketStatus, socketResult, setAnalysisResult, navigate]);

  // Append socket logs to visible logs (real logs replace fake ones)
  useEffect(() => {
    if (socketLogs.length > 0) {
      setVisibleLogs(socketLogs);
      // Auto-scroll
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }
  }, [socketLogs]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Reveal fake logs one-by-one ONLY if no real socket logs have arrived yet
  useEffect(() => {
    // If real logs are streaming in, don't show fake ones
    if (socketLogs.length > 0) return;
    let idx = 0;
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      if (idx < logLines.length) {
        setVisibleLogs((prev) => {
          // Stop injecting fake logs once real ones start
          if (socketLogs.length > 0) return prev;
          return [...prev, logLines[idx]];
        });
        idx++;
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }
    }, 800);
    return () => clearInterval(interval);
  }, [socketLogs.length]);

  // Step progression animation
  // IMPORTANT: When a real prescriptionId is set, do NOT auto-navigate at the end —
  // the socket controls navigation. The animation just shows visual progress.
  useEffect(() => {
    let stepIdx = 0;
    let elapsed = 0;

    const tick = setInterval(() => {
      if (pausedRef.current) return;
      // If graph is waiting for verification, freeze animation at step 0
      if (socketStatus === "waiting") return;

      const totalDur = steps[stepIdx].duration;
      elapsed += 100;
      const pct = Math.min((elapsed / totalDur) * 100, 100);
      setStepProgress(pct);

      if (elapsed >= totalDur) {
        if (stepIdx < steps.length - 1) {
          stepIdx++;
          elapsed = 0;
          setCurrentStep(stepIdx);
          setStepProgress(0);
        } else {
          clearInterval(tick);
          // Only auto-navigate in demo mode (no real prescriptionId)
          if (!prescriptionId) {
            setTimeout(() => navigate("/results"), 800);
          }
        }
      }
    }, 100);

    return () => clearInterval(tick);
  }, [navigate, prescriptionId, socketStatus]);

  // ETA countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      setEtaSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AppLayout>
      <div className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-bold text-ink">Processing Prescription</h1>
            {socketStatus === "waiting" ? (
              <span className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse inline-block" />
                AWAITING REVIEW
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                <span className="live-dot" style={{ background: "#ef4444" }} />
                LIVE
              </span>
            )}
          </div>
          <p className="text-sm text-ink-secondary mb-4">
            Our clinical RAG-engine is currently analyzing your handwritten upload for accuracy, interactions, and scheduling.
          </p>

          {/* Verification waiting banner */}
          {socketStatus === "waiting" && (
            <div className="flex items-start gap-4 bg-purple-50 border border-purple-200 rounded-2xl px-5 py-4 mb-5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Pause size={16} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-purple-800">AI Pipeline paused — awaiting admin verification</p>
                <p className="text-xs text-purple-600 mt-0.5 leading-relaxed">
                  The Vision Agent has extracted medication data and is waiting for a clinician to review and confirm accuracy before the Safety, RAG, and Scheduling agents continue.
                </p>
              </div>
              <button
                onClick={() => navigate("/admin")}
                className="btn-primary text-xs py-2 flex-shrink-0"
              >
                Go to Admin Panel →
              </button>
            </div>
          )}


          <div className="grid grid-cols-[1fr_380px] gap-5">
            {/* Steps */}
            <div className="card p-6">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[22px] top-10 bottom-10 w-0.5 bg-slate-200 z-0" />
                {/* Progress overlay */}
                <div
                  className="absolute left-[22px] top-10 w-0.5 bg-gradient-to-b from-green-400 to-brand-500 z-0 transition-all duration-300"
                  style={{
                    height: `${Math.min(currentStep / (steps.length - 1), 1) * 100}%`,
                  }}
                />

                <div className="flex flex-col gap-8 relative z-10">
                  {steps.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    const pending = i > currentStep;

                    return (
                      <div key={i} className="flex items-start gap-4">
                        {/* Icon bubble */}
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            done
                              ? "bg-green-100 text-green-600 ring-2 ring-green-200"
                              : active
                              ? "bg-brand-600 text-white shadow-lg shadow-brand-200 ring-2 ring-brand-200"
                              : "bg-slate-100 text-ink-muted"
                          }`}
                        >
                          {step.icon}
                        </div>

                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold text-sm ${pending ? "text-ink-muted" : "text-ink"}`}>
                              {step.title}
                            </p>
                            {done && (
                              <span className="badge-success text-xs">✓ Complete</span>
                            )}
                            {active && (
                              <span className="badge-blue animate-pulse">Processing...</span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted mt-1 leading-relaxed">{step.desc}</p>

                          {/* Active progress bar */}
                          {active && (
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 to-blue-400 rounded-full transition-all duration-100"
                                style={{ width: `${stepProgress}%` }}
                              />
                            </div>
                          )}
                          {/* Done bar */}
                          {done && (
                            <div className="mt-3 h-1.5 bg-green-100 rounded-full overflow-hidden">
                              <div className="h-full w-full bg-green-400 rounded-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={() => navigate("/upload")}
                  className="btn-danger text-sm"
                >
                  <X size={15} />
                  Cancel Processing
                </button>
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="btn-secondary text-sm"
                >
                  <Pause size={15} />
                  {paused ? "Resume" : "Pause for Review"}
                </button>
                <div className="ml-auto flex items-center gap-2 text-sm text-ink-muted">
                  <Clock size={14} className="animate-spin-slow" />
                  Est. {etaSeconds} seconds remaining
                </div>
              </div>
            </div>

            {/* Right panel: live log + AI insight */}
            <div className="flex flex-col gap-4">
              {/* Terminal */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <ChevronRight size={13} className="text-green-400" />
                    <span className="terminal-log text-green-400 font-bold">SYSTEM_LIVE_LOG</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                <p className="terminal-log text-gray-500 px-4 py-1 text-[10px]">rag-stream://engine.02</p>
                <div
                  ref={logRef}
                  className="p-4 h-80 overflow-y-auto flex flex-col gap-1"
                >
                  {visibleLogs.filter(Boolean).map((log, i) => {
                    // Normalize: socket might send a plain string, always safe
                    const isObj = log && typeof log === "object";
                    const time = isObj ? log.time : "";
                    const level = isObj ? (log.level || "INFO") : "INFO";
                    const msg = isObj ? log.msg : String(log);
                    return (
                      <div key={i} className="terminal-log flex gap-3 animate-fade-in">
                        <span className="text-gray-500 flex-shrink-0">{time}</span>
                        <span className={`flex-shrink-0 font-bold ${levelColor[level] || "text-gray-400"}`}>
                          [{level}]
                        </span>
                        <span className="text-gray-300">{msg}</span>
                      </div>
                    );
                  })}
                  {/* Blinking cursor */}
                  <div className="terminal-log text-green-400 mt-1">
                    <span className="animate-blink">█</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-gray-800">
                  <span className="terminal-log text-gray-400 text-[10px]">ENCRYPTION: AES-256-GCM</span>
                  <span className="terminal-log text-yellow-400 text-[10px] font-bold border border-yellow-600 px-2 py-0.5 rounded">
                    BUFFERING
                  </span>
                </div>
              </div>

              {/* AI Insight card */}
              <div className="card border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                    <span className="text-sm">🤖</span>
                  </div>
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wide">AI Insight</span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Analyzing "Metformin" alongside your history of renal tests. The engine is calculating safest dosage adjustments.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </AppLayout>
  );
}
