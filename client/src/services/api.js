import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor: attach auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ss_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: handle 401/403 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("ss_token");
      localStorage.removeItem("ss_user");
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });

export const registerUser = (name, email, password) =>
  api.post("/auth/register", { name, email, password });

// ─── AI Analysis ──────────────────────────────────────────────────────────────

/**
 * POST /api/analyze
 * Send a base64-encoded prescription image for AI analysis
 * @param {string} imageBase64 - base64 encoded image string
 * @returns {{ message: string, prescriptionId: string }}
 */
export const analyzePrescription = (imageBase64) =>
  api.post("/analyze", { image: imageBase64 });

// ─── Prescriptions ────────────────────────────────────────────────────────────

/**
 * GET /api/prescriptions
 * Fetch all prescriptions for the authenticated user
 */
export const getPrescriptions = () => api.get("/prescriptions");

/**
 * GET /api/prescriptions/:id
 */
export const getPrescriptionById = (id) => api.get(`/prescriptions/${id}`);

// ─── Admin (stubs — backend routes not yet implemented) ───────────────────────

export const approveScan = (jobId, overrides) => api.post(`/admin/approve/${jobId}`, overrides);
export const rejectScan = (jobId, reason) => api.post(`/admin/reject/${jobId}`, { reason });
export const escalateScan = (jobId) => api.post(`/admin/escalate/${jobId}`);

// ─── Chat (stub — backend route not yet implemented) ──────────────────────────

/**
 * POST /api/chat
 * Send a message to ScriptChat
 * @param {{ message: string, prescriptionId: string, history: [] }}
 */
export const sendChatMessage = (payload) => api.post("/chat", payload);

export default api;
