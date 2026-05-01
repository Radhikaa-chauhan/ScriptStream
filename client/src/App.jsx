import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadIdle from "./pages/UploadIdle";
import Processing from "./pages/Processing";
import AnalysisResults from "./pages/AnalysisResults";
import MediChat from "./pages/MediChat";
import AdminOps from "./pages/AdminOps";
import Prescriptions from "./pages/Prescriptions";

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadIdle /></ProtectedRoute>} />
            <Route path="/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><AnalysisResults /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><MediChat /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminOps /></ProtectedRoute>} />
            <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
