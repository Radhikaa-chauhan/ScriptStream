import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Pill,
  Clock,
  CheckCircle2,
  CalendarDays,
  FileText,
  Plus,
  Zap,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";

const scheduleItems = [
  { time: "08:00 AM", med: "Metformin 500mg", status: "taken" },
  { time: "08:00 AM", med: "Vitamin D3", status: "taken" },
  { time: "10:00 AM", med: "Lisinopril 10mg", status: "upcoming", highlight: true },
  { time: "02:00 PM", med: "Atorvastatin 20mg", status: "upcoming" },
  { time: "08:00 PM", med: "Metformin 500mg", status: "upcoming" },
];

const prescriptions = [
  { id: "RX-9012", date: "Oct 24, 2024", physician: "Dr. Sarah Smith", meds: "Lisinopril, Atorvastatin", status: "Verified", accuracy: 98 },
  { id: "RX-8843", date: "Oct 12, 2024", physician: "Dr. James Wong", meds: "Metformin", status: "Review Required", accuracy: 82 },
  { id: "RX-7721", date: "Sep 28, 2024", physician: "Dr. Sarah Smith", meds: "Amoxicillin", status: "Verified", accuracy: 99 },
  { id: "RX-6502", date: "Sep 15, 2024", physician: "General Health Clinic", meds: "Vitamin D3", status: "Verified", accuracy: 96 },
  { id: "RX-5491", date: "Aug 30, 2024", physician: "Dr. Emily Brown", meds: "Ibuprofen 600mg", status: "Verified", accuracy: 97 },
];

const insights = [
  {
    color: "border-amber-400 bg-amber-50",
    icon: <AlertTriangle size={16} className="text-amber-600" />,
    title: "Potential Interaction",
    desc: "Metformin and recent NSAID upload (Ibuprofen) may affect renal clearance. Discuss with your GP.",
  },
  {
    color: "border-blue-400 bg-blue-50",
    icon: <TrendingUp size={16} className="text-blue-600" />,
    title: "Optimization Tip",
    desc: "Studies suggest Lisinopril may be more effective when taken in the evening for blood pressure control.",
  },
  {
    color: "border-green-400 bg-green-50",
    icon: <Zap size={16} className="text-green-600" />,
    title: "Adherence Milestone",
    desc: "You've maintained 100% adherence for 7 days! Consistency significantly improves long-term outcomes.",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  const getStatusBadge = (status) => {
    if (status === "Verified") return <span className="badge-success">{status}</span>;
    if (status === "Review Required") return <span className="badge-danger">{status}</span>;
    return <span className="badge-warning">{status}</span>;
  };

  return (
    <AppLayout>
      <div className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Patient Dashboard</h1>
              <p className="text-sm text-ink-secondary mt-0.5">
                Welcome back, {firstName}. Your health vitals and medication schedules are up to date.
              </p>
            </div>
            <button onClick={() => navigate("/upload")} className="btn-primary">
              <Plus size={16} />
              Upload New Prescription
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Pill size={20} className="text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Active Medications</p>
                <p className="text-3xl font-display font-bold text-ink leading-none mt-0.5">4</p>
                <p className="text-xs text-ink-muted mt-0.5">Across 3 health conditions</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Next Dose In</p>
                <p className="text-3xl font-display font-bold text-ink leading-none mt-0.5">42m</p>
                <p className="text-xs text-ink-muted mt-0.5">Lisinopril (10mg) @ 10:00 AM</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Adherence Score</p>
                <p className="text-3xl font-display font-bold text-ink leading-none mt-0.5">94%</p>
                <p className="text-xs text-green-600 mt-0.5">+2% from previous week</p>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={17} className="text-brand-600" />
                <h2 className="font-display font-semibold text-base text-ink">Today's Schedule</h2>
              </div>
              <button className="text-sm text-brand-600 font-medium hover:underline">
                View Full Calendar
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {scheduleItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 w-44 rounded-xl border p-3.5 transition-all ${
                    item.highlight
                      ? "border-brand-400 bg-brand-50 shadow-sm"
                      : "border-slate-100 bg-surface-secondary"
                  }`}
                >
                  <p className="text-xs font-medium text-ink-muted">{item.time}</p>
                  <p className="text-sm font-semibold text-ink mt-1 leading-snug">{item.med}</p>
                  <span
                    className={`text-xs mt-2 inline-block font-medium ${
                      item.status === "taken" ? "text-green-600" : "text-ink-muted"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom two-column */}
          <div className="grid grid-cols-[1fr_340px] gap-4">
            {/* Recent Prescriptions */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={17} className="text-brand-600" />
                  <h2 className="font-display font-semibold text-base text-ink">Recent Prescriptions</h2>
                </div>
                <button className="text-sm text-brand-600 font-medium hover:underline">
                  Manage Records
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["ID", "Date", "Physician", "Status", "Accuracy"].map((h) => (
                      <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr
                      key={rx.id}
                      className="border-b border-slate-50 hover:bg-surface-secondary transition-colors cursor-pointer"
                      onClick={() => navigate("/prescriptions")}
                    >
                      <td className="py-3 pr-4 text-brand-600 font-semibold">{rx.id}</td>
                      <td className="py-3 pr-4 text-ink-secondary">{rx.date}</td>
                      <td className="py-3 pr-4">
                        <span className="text-ink font-medium">{rx.physician}</span>
                        <br />
                        <span className="text-xs text-ink-muted">{rx.meds}</span>
                      </td>
                      <td className="py-3 pr-4">{getStatusBadge(rx.status)}</td>
                      <td className="py-3 font-semibold text-green-600">{rx.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Health Insights */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={17} className="text-brand-600" />
                <h2 className="font-display font-semibold text-base text-ink">AI Health Insights</h2>
              </div>
              <p className="text-xs text-ink-muted mb-3">Proactive Analysis • Based on current prescription sync</p>
              <div className="flex flex-col gap-3">
                {insights.map((ins, i) => (
                  <div key={i} className={`rounded-xl border-l-4 p-3.5 ${ins.color}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {ins.icon}
                      <span className="text-xs font-bold text-ink">{ins.title}</span>
                    </div>
                    <p className="text-xs text-ink-secondary leading-relaxed">{ins.desc}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/chat")}
                className="w-full mt-4 btn-secondary justify-center text-sm"
              >
                <MessageSquare size={15} />
                Ask ScriptChat for Details
                <ChevronRight size={14} />
              </button>

              {/* Refill */}
              <div className="mt-3 flex items-start gap-3 p-3.5 bg-surface-secondary rounded-xl border border-slate-100">
                <RefreshCw size={15} className="text-ink-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink">Need a Refill?</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Lisinopril supply low (4 days left). Click to notify Dr. Smith.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </AppLayout>
  );
}
