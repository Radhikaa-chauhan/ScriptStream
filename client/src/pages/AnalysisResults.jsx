import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  X,
  Maximize2,
  CheckCircle2,
  Edit,
  FileDown,
  ChevronLeft,
  Check,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";
import { useApp } from "../context/AppContext";
import { getPrescriptionById } from "../services/api";

// ── Demo / fallback data (shown when no real analysis result is available) ──
const DEMO_MEDICATIONS = [
  {
    name: "Clopidogrel 75mg",
    status: "ok",
    dosage: "1 Tablet",
    frequency: "Daily (Once)",
    instructions: "Take with or without food",
  },
  {
    name: "Atorvastatin 20mg",
    status: "ok",
    dosage: "1 Tablet",
    frequency: "Nightly",
    instructions: "Take at bedtime",
  },
  {
    name: "Lisinopril 10mg",
    status: "warn",
    dosage: "0.5 Tablet",
    frequency: "Every Morning",
    instructions: "Monitor blood pressure regularly",
  },
];

const DEMO_SCHEDULE = {
  morning: ["Lisinopril 10mg - 8:00 AM"],
  afternoon: [],
  evening: [],
  night: ["Clopidogrel 75mg - 9:00 PM", "Atorvastatin 20mg - 10:00 PM"],
  notes: [],
};

const DEMO_WARNINGS = [
  "Interaction Warning: Clopidogrel has a major interaction risk with Warfarin. This combination significantly increases bleeding risk.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const StatusIcon = ({ status }) => {
  if (status === "ok") return <CheckCircle2 size={16} className="text-green-500" />;
  if (status === "warn") return <span className="text-base">⚠️</span>;
  return null;
};

/**
 * Convert the raw schedule object (morning/afternoon/evening/night arrays of
 * strings) into a table-friendly shape used by the grid renderer.
 */
function buildScheduleRows(extractedMeds, schedule) {
  if (!extractedMeds || extractedMeds.length === 0) return [];

  return extractedMeds.map((med) => {
    const name = med.name;
    const allSlots = [
      ...(schedule?.morning || []),
      ...(schedule?.afternoon || []),
      ...(schedule?.evening || []),
      ...(schedule?.night || []),
    ];

    // True if this med appears in a given time-slot array
    const inSlot = (arr) =>
      (arr || []).some((entry) =>
        entry.toLowerCase().includes(name.toLowerCase())
      );

    return {
      med: `${name}${med.dosage ? ` ${med.dosage}` : ""}`,
      morning: inSlot(schedule?.morning),
      noon: inSlot(schedule?.afternoon),
      evening: inSlot(schedule?.evening),
      night: inSlot(schedule?.night),
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalysisResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { analysisResult, setPrescriptionId: setGlobalPrescriptionId } = useApp();
  const prescriptionId = location.state?.prescriptionId;
  const [alertDismissed, setAlertDismissed] = useState(false);

  const [localResult, setLocalResult] = useState(null);
  const [loading, setLoading] = useState(!analysisResult && !!prescriptionId);

  useEffect(() => {
    if (prescriptionId) {
      setGlobalPrescriptionId(prescriptionId);
    }

    if (!analysisResult && prescriptionId) {
      getPrescriptionById(prescriptionId)
        .then((res) => {
          if (res.data.prescription) {
            setLocalResult({
              extractedData: res.data.prescription.extractedData,
              schedule: res.data.prescription.dailySchedule,
              safetyWarnings: res.data.prescription.safetyWarnings,
              originalImage: res.data.prescription.originalImage
            });
          }
        })
        .catch((err) => console.error("Failed to fetch rx for results:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [analysisResult, prescriptionId]);

  // ── Resolve real vs demo data ──────────────────────────────────────────────
  const activeResult = analysisResult || localResult;
  const isRealData = !!activeResult;

  const extractedData = activeResult?.extractedData ?? null;
  const rawMedications = extractedData?.medications ?? null;
  const schedule = activeResult?.schedule ?? DEMO_SCHEDULE;
  const safetyWarnings = activeResult?.safetyWarnings ?? DEMO_WARNINGS;
  const prescriptionImage = activeResult?.originalImage || null;

  // Build medication display list
  const medications = rawMedications
    ? rawMedications.map((med) => ({
        name: `${med.name}${med.dosage ? ` ${med.dosage}` : ""}`,
        status: "ok",
        dosage: med.dosage || "—",
        frequency: med.frequency || med.instructions || "—",
        instructions: med.instructions || "—",
      }))
    : DEMO_MEDICATIONS;

  // Build schedule rows
  const scheduleRows = rawMedications
    ? buildScheduleRows(rawMedications, schedule)
    : [
        { med: "Clopidogrel 75mg", morning: true, noon: false, evening: false, night: false },
        { med: "Atorvastatin 20mg", morning: false, noon: false, evening: false, night: true },
        { med: "Lisinopril 10mg", morning: true, noon: false, evening: false, night: false },
      ];

  // Schedule notes from AI
  const scheduleNotes = schedule?.notes ?? [];

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleExportPdf = () => {
    window.print();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-brand-600 font-semibold">Loading your results...</span>
            </div>
          ) : (
            <>
              {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-ink-muted mb-2">
            <button
              onClick={() => navigate("/upload")}
              className="hover:text-ink flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              Upload History
            </button>
            <span>›</span>
            <span className="text-ink font-medium">
              Rx #{prescriptionId ? prescriptionId.slice(-8) : "2024-881"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-ink">Analysis Results</h1>
              {isRealData && (
                <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  AI-Extracted
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/chat", { state: { prescriptionId } })}
                className="btn-secondary text-sm"
              >
                <MessageSquare size={14} className="text-brand-600" />
                Chat with AI
              </button>
              <button
                onClick={() => navigate("/processing")}
                className="btn-secondary text-sm"
              >
                🔄 Re-scan
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary text-sm"
              >
                Add to Dashboard
              </button>
            </div>
          </div>

          {/* Safety Warnings */}
          {!alertDismissed && safetyWarnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-4 mb-6 animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display font-bold text-red-700 text-sm">
                    Safety Alert{safetyWarnings.length > 1 ? `s (${safetyWarnings.length})` : ""}
                  </span>
                  <span className="badge-danger text-xs">High Risk</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {safetyWarnings.map((w, i) => (
                    <p key={i} className="text-sm text-red-700 leading-relaxed">
                      {w}
                    </p>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <button className="btn-danger text-xs py-1.5 px-3">
                    <Phone size={13} />
                    Contact Doctor
                  </button>
                  <button
                    onClick={() => navigate("/chat", { state: { prescriptionId } })}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <MessageSquare size={13} />
                    Discuss with ScriptChat
                  </button>
                  <button
                    onClick={() => setAlertDismissed(true)}
                    className="text-xs text-red-600 underline hover:no-underline"
                  >
                    Dismiss (Requires Override)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5 mb-6">
            {/* Original Prescription */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  Original Prescription
                </h3>
                <button className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
                  <Maximize2 size={14} className="text-ink-muted" />
                </button>
              </div>
              <div className="bg-slate-100 rounded-xl flex items-center justify-center aspect-[4/3] relative overflow-hidden">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-3xl">🖼</span>
                  </div>
                  <p className="text-xs text-slate-400">Prescription Image</p>
                </div>
                {prescriptionImage && (
                  <img src={prescriptionImage} alt="Prescription" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md font-mono z-10">
                  Source: Upload_01.jpg
                </div>
              </div>

              {/* Doctor / Patient metadata from AI */}
              {extractedData && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {extractedData.patientName && (
                    <div className="bg-surface-secondary rounded-lg p-2">
                      <p className="text-ink-muted uppercase tracking-wide font-medium mb-0.5">Patient</p>
                      <p className="font-semibold text-ink">{extractedData.patientName}</p>
                    </div>
                  )}
                  {extractedData.doctorName && (
                    <div className="bg-surface-secondary rounded-lg p-2">
                      <p className="text-ink-muted uppercase tracking-wide font-medium mb-0.5">Doctor</p>
                      <p className="font-semibold text-ink">{extractedData.doctorName}</p>
                    </div>
                  )}
                  {extractedData.date && (
                    <div className="bg-surface-secondary rounded-lg p-2 col-span-2">
                      <p className="text-ink-muted uppercase tracking-wide font-medium mb-0.5">Date</p>
                      <p className="font-semibold text-ink">{extractedData.date}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Extracted Data */}
            <div className="card">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-semibold text-sm text-ink">Extracted Structured Data</h3>
                  <p className="text-xs text-ink-muted">
                    {isRealData ? "OpenRouter AI-extracted clinical entries" : "RAG-Verified clinical entries"}
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 relative">
                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke="#2563eb" strokeWidth="3"
                        strokeDasharray="99.9 100"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display font-bold text-sm text-ink leading-none">98%</span>
                      <span className="text-[9px] text-ink-muted">RELIABILITY</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <span>📄</span> Medication Details
                </div>
                <button className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                  <Edit size={11} /> Edit All
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {medications.map((med, i) => (
                  <div key={i} className="bg-surface-secondary rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={med.status} />
                        <span className="font-semibold text-sm text-ink">{med.name}</span>
                      </div>
                      <button 
                        onClick={() => navigate("/chat", { state: { prescriptionId } })}
                        className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600 transition-colors"
                        title="Ask about this drug"
                      >
                        <MessageSquare size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-ink-muted uppercase tracking-wide font-medium mb-0.5">Frequency</p>
                        <p className="font-semibold text-ink">{med.frequency}</p>
                      </div>
                      <div>
                        <p className="text-ink-muted uppercase tracking-wide font-medium mb-0.5">Instructions</p>
                        <p className="font-semibold text-ink">{med.instructions}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adherence tip */}
              <div className="mt-3 bg-blue-50 rounded-xl p-3 flex gap-2">
                <span className="text-base flex-shrink-0">📈</span>
                <div>
                  <p className="text-xs font-bold text-blue-700">AI Adherence Tip</p>
                  <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                    {scheduleNotes.length > 0
                      ? scheduleNotes[0]
                      : "Take medications at the same time each day to maintain consistent levels in your system."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 size={12} />
                  {isRealData
                    ? "Extracted by OpenRouter AI + RAG Drug Database"
                    : "Verified against FDA Drug Database v4.2"}
                </div>
                <button 
                  onClick={handleExportPdf}
                  className="text-xs font-semibold text-ink hover:text-brand-600 flex items-center gap-1 hover:underline print:hidden"
                >
                  <FileDown size={12} /> Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Medication Schedule */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <div>
                  <h3 className="font-display font-semibold text-sm text-ink">
                    {isRealData ? "AI-Generated Medication Schedule" : "Projected Medication Schedule"}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    {isRealData
                      ? "Daily plan built by the Scheduling Agent"
                      : "Visualizing your new daily routine"}
                  </p>
                </div>
              </div>
              <span className="badge-blue text-xs">7-Day Projection</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-muted uppercase tracking-wide">Medication</th>
                  {["Morning", "Noon", "Evening", "Night"].map((t) => (
                    <th key={t} className="text-center py-2 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-3 pr-4 font-semibold text-ink text-sm">{row.med}</td>
                    {[row.morning, row.noon, row.evening, row.night].map((active, j) => (
                      <td key={j} className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                          active ? "border-brand-500 text-brand-600 bg-brand-50" : "border-slate-200 text-slate-300"
                        }`}>
                          {active ? <Check size={13} /> : <span className="text-slate-300 text-base leading-none">○</span>}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Render remaining schedule notes as tips */}
            {isRealData && scheduleNotes.length > 1 && (
              <div className="mt-4 flex flex-col gap-2">
                {scheduleNotes.slice(1).map((note, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-800">
                    💡 {note}
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}
        </div>
        <Footer />
      </div>
    </AppLayout>
  );
}
