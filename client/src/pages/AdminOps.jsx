import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  X,
  ChevronDown,
  ZoomIn,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";

const stats = [
  { label: "Total Scans", value: "1,284", color: "text-ink" },
  { label: "Verified", value: "1,102", color: "text-green-600" },
  { label: "Pending Review", value: "98", color: "text-amber-600" },
  { label: "Flagged", value: "84", color: "text-red-600" },
];

const records = [
  { id: "ALRT-8842", patient: "Michael Chen", date: "Oct 24, 2024", drug: "Amoxicillin", status: "Flagged", accuracy: 71, assigned: "System Admin" },
  { id: "RX-8843", patient: "Sarah Kim", date: "Oct 22, 2024", drug: "Metformin", status: "Review Required", accuracy: 82, assigned: "Dr. Lee" },
  { id: "RX-9012", patient: "James Patel", date: "Oct 20, 2024", drug: "Lisinopril, Atorvastatin", status: "Verified", accuracy: 98, assigned: "System Admin" },
  { id: "RX-7721", patient: "Emma Wilson", date: "Oct 18, 2024", drug: "Amoxicillin", status: "Verified", accuracy: 99, assigned: "Dr. Wong" },
  { id: "ALRT-8800", patient: "David Nguyen", date: "Oct 15, 2024", drug: "Warfarin", status: "Flagged", accuracy: 65, assigned: "System Admin" },
  { id: "RX-6502", patient: "Lisa Thompson", date: "Oct 12, 2024", drug: "Vitamin D3", status: "Verified", accuracy: 96, assigned: "Dr. Smith" },
];

const statusBadge = (s) => {
  if (s === "Verified") return <span className="badge-success">{s}</span>;
  if (s === "Flagged") return <span className="badge-danger">{s}</span>;
  return <span className="badge-warning">{s}</span>;
};

export default function AdminOps() {
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState(records[0]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [drugName, setDrugName] = useState("Amoxicillin");
  const [dosage, setDosage] = useState("500mg");
  const [frequency, setFrequency] = useState("TID");

  const handleApprove = () => {
    alert("Results approved and published successfully!");
    setPanelOpen(false);
  };

  const handleReject = () => {
    alert("Scan rejected. Patient will be notified.");
    setPanelOpen(false);
  };

  const handleEscalate = () => {
    alert("Case escalated to supervising doctor.");
    setPanelOpen(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 flex gap-5">
          {/* Main content */}
          <div className={`flex flex-col flex-1 min-w-0 transition-all ${panelOpen ? "mr-0" : ""}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink">Admin Operations</h1>
                <p className="text-sm text-ink-secondary mt-0.5">Review and manage flagged prescription scans</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              {stats.map((s, i) => (
                <div key={i} className="card text-center">
                  <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-ink-muted mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="card flex-1">
              {/* Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-surface-secondary border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                </div>
                <button className="btn-secondary text-sm py-2">
                  <Filter size={14} />
                  Filter
                  <ChevronDown size={13} />
                </button>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["ID", "Patient", "Date", "Drug", "Status", "Accuracy", "Assigned"].map((h) => (
                      <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => { setSelectedRecord(rec); setPanelOpen(true); }}
                      className={`border-b border-slate-50 cursor-pointer transition-colors ${
                        selectedRecord?.id === rec.id && panelOpen
                          ? "bg-brand-50"
                          : "hover:bg-surface-secondary"
                      }`}
                    >
                      <td className="py-3 pr-4 font-semibold text-brand-600">{rec.id}</td>
                      <td className="py-3 pr-4 font-medium text-ink">{rec.patient}</td>
                      <td className="py-3 pr-4 text-ink-secondary">{rec.date}</td>
                      <td className="py-3 pr-4 text-ink">{rec.drug}</td>
                      <td className="py-3 pr-4">{statusBadge(rec.status)}</td>
                      <td className={`py-3 pr-4 font-semibold ${rec.accuracy >= 90 ? "text-green-600" : rec.accuracy >= 80 ? "text-amber-600" : "text-red-600"}`}>
                        {rec.accuracy}%
                      </td>
                      <td className="py-3 text-ink-secondary">{rec.assigned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side panel */}
          {panelOpen && selectedRecord && (
            <div className="w-96 flex-shrink-0 animate-slide-in">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-card-xl overflow-hidden h-full flex flex-col">
                {/* Panel header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <AlertOctagon size={16} className="text-red-500" />
                      <h3 className="font-display font-bold text-sm text-ink">Flagged Review</h3>
                    </div>
                    <p className="text-xs text-ink-muted">
                      ID: {selectedRecord.id} • Assigned to {selectedRecord.assigned}
                    </p>
                  </div>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-1 rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    <X size={15} className="text-ink-muted" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                  {/* Handwritten source */}
                  <div>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">
                      Handwritten Source
                    </p>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl overflow-hidden relative">
                      <div className="p-4 text-center min-h-[160px] flex items-center justify-center">
                        <div className="font-mono text-xs text-ink leading-relaxed text-left">
                          <p className="font-bold mb-2 text-sm">Px</p>
                          <p>Amoxicillin 500mg, twice daily</p>
                          <p>Ibuprofen 400mg, as needed</p>
                          <p>Prednisone 20, daily x 5 days</p>
                          <p className="mt-4 text-ink-muted text-[10px]">Dr. Eleanor Vance</p>
                          <p className="text-ink-muted text-[10px]">License #12345</p>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                        <ZoomIn size={9} />
                        Zoom: 1.2x
                      </div>
                    </div>
                  </div>

                  {/* AI Extracted Details */}
                  <div>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">
                      AI Extracted Details
                    </p>
                    <div className="mb-3">
                      <label className="text-xs font-medium text-ink-muted mb-1 block">Drug Name</label>
                      <div className="flex gap-2">
                        <input
                          value={drugName}
                          onChange={(e) => setDrugName(e.target.value)}
                          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                        />
                        <span className="badge-danger self-center flex-shrink-0">Low Confidence</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-medium text-ink-muted mb-1 block">Dosage</label>
                        <input
                          value={dosage}
                          onChange={(e) => setDosage(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-ink-muted mb-1 block">Frequency</label>
                        <input
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                        />
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-red-600 mb-1">
                        <AlertOctagon size={13} />
                        <span className="text-xs font-bold">Flag Reason</span>
                      </div>
                      <p className="text-xs text-red-600 leading-relaxed">
                        Illegible dosage field: 'TID' could be 'BID' due to ink smudge.
                      </p>
                    </div>
                  </div>

                  {/* System Context */}
                  <div>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">
                      System Context
                    </p>
                    <div className="bg-surface-secondary rounded-xl divide-y divide-slate-100">
                      {[
                        { label: "Patient:", value: selectedRecord.patient, color: "text-ink" },
                        { label: "OCR Engine:", value: "Vision-X Pro", color: "text-ink" },
                        { label: "RAG Match:", value: "Verified Database Entry", color: "text-green-600" },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-ink-muted">{row.label}</span>
                          <span className={`text-xs font-semibold ${row.color}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-slate-100 flex flex-col gap-2.5">
                  <button onClick={handleApprove} className="btn-primary w-full justify-center">
                    <CheckCircle2 size={15} />
                    Approve & Publish Results
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleReject} className="btn-secondary justify-center text-sm">
                      Reject Scan
                    </button>
                    <button onClick={handleEscalate} className="btn-secondary justify-center text-sm">
                      Escalate to Doctor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </AppLayout>
  );
}
