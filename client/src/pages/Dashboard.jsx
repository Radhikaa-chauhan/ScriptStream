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
  Loader2
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { getPrescriptions } from "../services/api";

// Added Component wrapper and export
export default function Dashboard() {
  // Added navigate initialization
  const navigate = useNavigate();

  // Added user destructuring to get the firstName
  const { user } = useAuth();
  const firstName = user?.firstName || "Patient";

  // Mock data removed for production database sync
  const scheduleItems = [];
  const insights = [];

  const [prescriptions, setPrescriptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getPrescriptions();
        setPrescriptions(data.prescriptions || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    if (status === "processed") return <span className="badge-success">Verified</span>;
    if (status === "failed") return <span className="badge-danger">Failed</span>;
    return <span className="badge-warning">Review Required</span>;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return dateStr; }
  };

  const activeMedsCount = prescriptions
    .filter((rx) => rx.status === "processed")
    .reduce((acc, rx) => acc + (rx.extractedData?.medications?.length || 0), 0);

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
                <p className="text-3xl font-display font-bold text-ink leading-none mt-0.5">{activeMedsCount}</p>
                <p className="text-xs text-ink-muted mt-0.5">Across your verified records</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Next Dose In</p>
                <p className="text-3xl font-display font-bold text-ink leading-none mt-0.5">--</p>
                <p className="text-xs text-ink-muted mt-0.5">No immediate doses scheduled</p>
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
              {scheduleItems.length === 0 ? (
                <p className="text-sm text-ink-muted py-4">No medication schedule found. Upload a prescription to generate one.</p>
              ) : (
                scheduleItems.map((item, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 w-44 rounded-xl border p-3.5 transition-all ${item.highlight
                        ? "border-brand-400 bg-brand-50 shadow-sm"
                        : "border-slate-100 bg-surface-secondary"
                      }`}
                  >
                    <p className="text-xs font-medium text-ink-muted">{item.time}</p>
                    <p className="text-sm font-semibold text-ink mt-1 leading-snug">{item.med}</p>
                    <span
                      className={`text-xs mt-2 inline-block font-medium ${item.status === "taken" ? "text-green-600" : "text-ink-muted"
                        }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
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
                    {["ID", "Date", "Physician", "Status"].map((h) => (
                      <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center">
                        <Loader2 className="animate-spin inline text-brand-600" />
                      </td>
                    </tr>
                  ) : prescriptions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-ink-muted">
                        No prescriptions found.
                      </td>
                    </tr>
                  ) : (
                    prescriptions.slice(0, 5).map((rx) => (
                      <tr
                        key={rx._id}
                        className="border-b border-slate-50 hover:bg-surface-secondary transition-colors cursor-pointer"
                        onClick={() => navigate("/prescriptions")}
                      >
                        <td className="py-3 pr-4 text-brand-600 font-semibold">{rx._id?.slice(-8)}</td>
                        <td className="py-3 pr-4 text-ink-secondary">{formatDate(rx.createdAt)}</td>
                        <td className="py-3 pr-4">
                          <span className="text-ink font-medium">{rx.extractedData?.doctorName || "Unknown Physician"}</span>
                          <br />
                          <span className="text-xs text-ink-muted">
                            {rx.extractedData?.medications?.map((m) => m.name).join(", ") || "No meds listed"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{getStatusBadge(rx.status)}</td>
                      </tr>
                    ))
                  )}
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
                {insights.length === 0 ? (
                  <p className="text-xs text-ink-muted">No insights available yet. Insights will appear after your next AI analysis.</p>
                ) : (
                  insights.map((ins, i) => (
                    <div key={i} className={`rounded-xl border-l-4 p-3.5 ${ins.color}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {ins.icon}
                        <span className="text-xs font-bold text-ink">{ins.title}</span>
                      </div>
                      <p className="text-xs text-ink-secondary leading-relaxed">{ins.desc}</p>
                    </div>
                  ))
                )}
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