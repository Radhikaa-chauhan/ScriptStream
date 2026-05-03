import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://scriptstream.onrender.com/api";

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

export const registerUser = (name, email, password, phone) =>
  api.post("/auth/register", { name, email, password, phone });

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

/**
 * DELETE /api/prescriptions/:id
 */
export const deletePrescription = (id) => api.delete(`/prescriptions/${id}`);


// ─── Admin Verification (resumes the LangGraph workflow after human review) ──

export const verifyScan = (prescriptionId, extractedData) =>
  api.post("/verify", { prescriptionId, extractedData });

// ─── Specialized Admin Endpoints ──────────────────────────────────────────────

/**
 * GET /api/admin/pending
 * List all prescriptions waiting for human review
 */
export const getPendingPrescriptions = () => api.get("/admin/pending");

/**
 * POST /api/admin/verify/:id
 * Admin approves/edits data and resumes the pipeline
 */
export const verifyAdminPrescription = (id, verifiedData) =>
  api.post(`/admin/verify/${id}`, { verifiedData });

/**
 * DELETE /api/admin/prescription/:id
 */
export const deleteAdminPrescription = (id) => api.delete(`/admin/prescription/${id}`);

/**
 * POST /api/chat
 * Send a message to ScriptChat
 * @param {{ message: string, prescriptionId: string, history: [] }}
 */
export const sendChatMessage = (payload) => api.post("/chat", payload);

export default api;

