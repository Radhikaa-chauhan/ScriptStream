import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, ExternalLink, Loader2, Trash2 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";
import { getPrescriptions, deletePrescription } from "../services/api";

// Fallback mock data when backend returns no results or errors
const mockPrescriptions = [
  { _id: "RX-9012", createdAt: "2024-10-24T00:00:00Z", extractedData: { doctorName: "Dr. Sarah Smith" }, status: "processed", confidenceScore: 98 },
  { _id: "RX-8843", createdAt: "2024-10-12T00:00:00Z", extractedData: { doctorName: "Dr. James Wong" }, status: "pending", confidenceScore: 82 },
  { _id: "RX-7721", createdAt: "2024-09-28T00:00:00Z", extractedData: { doctorName: "Dr. Sarah Smith" }, status: "processed", confidenceScore: 99 },
  { _id: "RX-6502", createdAt: "2024-09-15T00:00:00Z", extractedData: { doctorName: "General Health Clinic" }, status: "processed", confidenceScore: 96 },
  { _id: "RX-5491", createdAt: "2024-08-30T00:00:00Z", extractedData: { doctorName: "Dr. Emily Brown" }, status: "processed", confidenceScore: 97 },
];

const getStatusLabel = (status) => {
  if (status === "processed") return "Verified";
  if (status === "failed") return "Failed";
  return "Review Required";
};

const getStatusBadge = (status) => {
  const label = getStatusLabel(status);
  if (label === "Verified") return <span className="badge-success">{label}</span>;
  if (label === "Failed") return <span className="badge-danger">{label}</span>;
  return <span className="badge-warning">{label}</span>;
};

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const getMedsList = (rx) => {
  if (rx.extractedData?.medications?.length) {
    return rx.extractedData.medications.map((m) => m.name).join(", ");
  }
  return "—";
};

export default function Prescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getPrescriptions();
        const items = data.prescriptions || [];
        setPrescriptions(items.length > 0 ? items : mockPrescriptions);
      } catch (err) {
        console.error("Failed to fetch prescriptions:", err);
        setFetchError("Could not load prescriptions from server. Showing sample data.");
        setPrescriptions(mockPrescriptions);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this prescription?")) return;

    // Check if it's a mock ID (e.g. RX-XXXX) or a real MongoDB ObjectId
    const isMock = typeof id === 'string' && id.startsWith('RX-');

    if (isMock) {
      setPrescriptions(prev => prev.filter(rx => rx._id !== id));
      return;
    }

    try {
      await deletePrescription(id);
      setPrescriptions(prev => prev.filter(rx => rx._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete prescription. This record may have already been removed.");
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Prescriptions</h1>
              <p className="text-sm text-ink-secondary mt-0.5">All your digitized prescription records</p>
            </div>
            <button onClick={() => navigate("/upload")} className="btn-primary">
              <Plus size={16} />
              New Upload
            </button>
          </div>

          {fetchError && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-4">
              {fetchError}
            </div>
          )}

          <div className="card">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="text-brand-600 animate-spin" />
                <span className="ml-3 text-sm text-ink-muted">Loading prescriptions...</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["ID", "Date", "Physician", "Medications", "Status", "Accuracy", ""].map((h, i) => (
                      <th key={i} className="text-left py-2 pr-4 text-xs font-semibold text-ink-muted uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr
                      key={rx._id}
                      className="border-b border-slate-50 hover:bg-surface-secondary transition-colors cursor-pointer"
                      onClick={() => navigate("/results", { state: { prescriptionId: rx._id } })}
                    >
                      <td className="py-3 pr-4 text-brand-600 font-semibold">{rx._id?.toString().slice(-8) || "—"}</td>
                      <td className="py-3 pr-4 text-ink-secondary">{formatDate(rx.createdAt)}</td>
                      <td className="py-3 pr-4 font-medium text-ink">{rx.extractedData?.doctorName || "—"}</td>
                      <td className="py-3 pr-4 text-ink-secondary">{getMedsList(rx)}</td>
                      <td className="py-3 pr-4">{getStatusBadge(rx.status)}</td>
                      <td className="py-3 pr-4 font-semibold text-green-600">{rx.confidenceScore || 0}%</td>
                      <td className="py-3 flex gap-2 justify-end pr-2">
                        <button 
                          onClick={(e) => handleDelete(e, rx._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-ink-muted hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-brand-50 text-ink-muted hover:text-brand-600 transition-colors">
                          <ExternalLink size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </AppLayout>
  );
}
