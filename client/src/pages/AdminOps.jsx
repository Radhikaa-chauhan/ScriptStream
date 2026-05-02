import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertOctagon,
  Search,
  CheckCircle2,
  X,
  ZoomIn,
  Loader2,
  RefreshCw,
  Clock,
  ShieldAlert,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";
import { getPendingPrescriptions, verifyAdminPrescription } from "../services/api";
import { useApp } from "../context/AppContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const statusBadge = (status) => {
  if (status === "awaiting_verification")
    return <span className="badge-warning">Awaiting Review</span>;
  if (status === "processed")
    return <span className="badge-success">Verified</span>;
  if (status === "failed")
    return <span className="badge-danger">Failed</span>;
  return <span className="badge-warning">Pending</span>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOps() {
  const navigate = useNavigate();
  const { setPrescriptionId } = useApp();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedRx, setSelectedRx] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [search, setSearch] = useState("");

  // Editable fields for AI-extracted data
  const [editMeds, setEditMeds] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await getPendingPrescriptions();
      const items = data || [];
      // Sort: awaiting_verification first, then by date desc
      const sorted = [...items].sort((a, b) => {
        if (a.status === "awaiting_verification" && b.status !== "awaiting_verification") return -1;
        if (b.status === "awaiting_verification" && a.status !== "awaiting_verification") return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setPrescriptions(sorted);
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      setFetchError("Could not load prescriptions from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openPanel = (rx) => {
    setSelectedRx(rx);
    // Pre-fill editable meds from extracted data
    const meds = rx.extractedData?.medications || [];
    setEditMeds(meds.map((m) => ({ ...m })));
    setPanelOpen(true);
    setActionMsg(null);
  };

  const handleApprove = async () => {
    if (!selectedRx) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      // Build updated extractedData with the admin-edited medications
      const updatedExtractedData = {
        ...selectedRx.extractedData,
        medications: editMeds,
      };
      await verifyAdminPrescription(selectedRx._id, updatedExtractedData);
      setActionMsg({ type: "success", text: "✅ Approved! LangGraph AI pipeline is now resuming — RAG lookup, safety check, and scheduling are running in the background." });
      // Update local state
      setPrescriptions((prev) =>
        prev.map((p) =>
          p._id === selectedRx._id ? { ...p, status: "pending" } : p
        )
      );

      // Save ID to context and redirect to processing screen to watch it resume
      setPrescriptionId(selectedRx._id);
      setTimeout(() => {
        navigate("/processing");
      }, 1200);

    } catch (err) {
      console.error("Verify error:", err);
      setActionMsg({ type: "error", text: `❌ Failed to approve: ${err.response?.data?.message || err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRx) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      // For now mark as failed locally (no dedicated reject endpoint yet)
      setActionMsg({ type: "warning", text: "⚠️ Scan rejected. Prescription has been marked as failed." });
      setPrescriptions((prev) =>
        prev.map((p) =>
          p._id === selectedRx._id ? { ...p, status: "failed" } : p
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = prescriptions.filter((rx) => {
    const q = search.toLowerCase();
    return (
      rx._id?.toString().toLowerCase().includes(q) ||
      rx.extractedData?.doctorName?.toLowerCase().includes(q) ||
      rx.extractedData?.medications?.some((m) => m.name?.toLowerCase().includes(q))
    );
  });

  const pending = prescriptions.filter((p) => p.status === "awaiting_verification").length;
  const verified = prescriptions.filter((p) => p.status === "processed").length;
  const failed = prescriptions.filter((p) => p.status === "failed").length;

  const stats = [
    { label: "Total Scans", value: prescriptions.length, color: "text-ink" },
    { label: "Verified", value: verified, color: "text-green-600" },
    { label: "Awaiting Review", value: pending, color: "text-amber-600" },
    { label: "Failed", value: failed, color: "text-red-600" },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 flex gap-5">
          {/* Main Content */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink">Admin Operations</h1>
                <p className="text-sm text-ink-secondary mt-0.5">
                  Review AI-extracted prescriptions before the pipeline resumes
                </p>
              </div>
              <button
                onClick={fetchData}
                className="btn-secondary text-sm py-2"
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
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

            {fetchError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">
                {fetchError}
              </div>
            )}

            {/* Table */}
            <div className="card flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Search by ID, doctor, or drug..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-surface-secondary border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                </div>
                {pending > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 font-medium">
                    <Clock size={12} />
                    {pending} scan{pending > 1 ? "s" : ""} awaiting your review
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="text-brand-600 animate-spin" />
                  <span className="ml-3 text-sm text-ink-muted">Loading prescriptions...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-ink-muted text-sm">
                  No prescriptions found.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["ID", "Date", "Doctor", "Medications", "Status", ""].map((h, i) => (
                        <th
                          key={i}
                          className="text-left py-2 pr-4 text-xs font-semibold text-ink-muted uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rx) => (
                      <tr
                        key={rx._id}
                        onClick={() => openPanel(rx)}
                        className={`border-b border-slate-50 cursor-pointer transition-colors ${
                          selectedRx?._id === rx._id && panelOpen
                            ? "bg-brand-50"
                            : "hover:bg-surface-secondary"
                        }`}
                      >
                        <td className="py-3 pr-4 font-semibold text-brand-600">
                          ...{rx._id?.toString().slice(-8)}
                        </td>
                        <td className="py-3 pr-4 text-ink-secondary">{formatDate(rx.createdAt)}</td>
                        <td className="py-3 pr-4 font-medium text-ink">
                          {rx.extractedData?.doctorName || "—"}
                        </td>
                        <td className="py-3 pr-4 text-ink-secondary">
                          {rx.extractedData?.medications?.map((m) => m.name).join(", ") || "—"}
                        </td>
                        <td className="py-3 pr-4">{statusBadge(rx.status)}</td>
                        <td className="py-3">
                          {rx.status === "awaiting_verification" && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <ShieldAlert size={12} />
                              Review
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Side Panel */}
          {panelOpen && selectedRx && (
            <div className="w-96 flex-shrink-0 animate-slide-in">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-card-xl overflow-hidden h-full flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <AlertOctagon size={16} className="text-amber-500" />
                      <h3 className="font-display font-bold text-sm text-ink">Human Verification</h3>
                    </div>
                    <p className="text-xs text-ink-muted">
                      ID: ...{selectedRx._id?.toString().slice(-8)} •{" "}
                      {formatDate(selectedRx.createdAt)}
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
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-muted">Status:</span>
                    {statusBadge(selectedRx.status)}
                  </div>

                  {/* Doctor / Patient Info */}
                  <div>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">
                      Prescription Info
                    </p>
                    <div className="bg-surface-secondary rounded-xl divide-y divide-slate-100">
                      {[
                        { label: "Doctor:", value: selectedRx.extractedData?.doctorName || "—" },
                        { label: "Patient:", value: selectedRx.extractedData?.patientName || "—" },
                        { label: "Date:", value: selectedRx.extractedData?.date || "—" },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-ink-muted">{row.label}</span>
                          <span className="text-xs font-semibold text-ink">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Editable Medications */}
                  <div>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">
                      AI Extracted Medications — Edit to Correct
                    </p>
                    {editMeds.length === 0 ? (
                      <p className="text-xs text-ink-muted">No medications extracted by AI.</p>
                    ) : (
                      editMeds.map((med, idx) => (
                        <div
                          key={idx}
                          className="border border-slate-200 rounded-xl p-3 mb-3 bg-surface-secondary"
                        >
                          <p className="text-[10px] font-bold text-brand-600 uppercase mb-2">
                            Drug #{idx + 1}
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { key: "name", label: "Drug Name" },
                              { key: "dosage", label: "Dosage" },
                              { key: "frequency", label: "Frequency" },
                              { key: "instructions", label: "Instructions" },
                            ].map(({ key, label }) => (
                              <div key={key}>
                                <label className="text-[10px] text-ink-muted mb-0.5 block font-medium">
                                  {label}
                                </label>
                                <input
                                  value={med[key] || ""}
                                  onChange={(e) =>
                                    setEditMeds((prev) =>
                                      prev.map((m, i) =>
                                        i === idx ? { ...m, [key]: e.target.value } : m
                                      )
                                    )
                                  }
                                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 bg-white"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Action message */}
                  {actionMsg && (
                    <div
                      className={`text-xs rounded-xl px-4 py-3 leading-relaxed ${
                        actionMsg.type === "success"
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : actionMsg.type === "warning"
                          ? "bg-amber-50 border border-amber-200 text-amber-700"
                          : "bg-red-50 border border-red-200 text-red-700"
                      }`}
                    >
                      {actionMsg.text}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-slate-100 flex flex-col gap-2.5">
                  {selectedRx.status === "awaiting_verification" ? (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="btn-primary w-full justify-center"
                      >
                        {actionLoading ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        Approve & Resume AI Pipeline
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        className="btn-secondary justify-center text-sm w-full"
                      >
                        Reject Scan
                      </button>
                    </>
                  ) : (
                    <div className="text-center text-xs text-ink-muted py-2">
                      This prescription has already been processed.
                    </div>
                  )}
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
