import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, Mail, Lock, User, Phone, ArrowRight, AlertCircle } from "lucide-react";
import { Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import logoImg from "../assets/logo.jpg";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password, phone);
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <img src={logoImg} alt="ScriptStream" className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-brand-200 mb-4" />
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">ScriptStream</h1>
          <p className="text-sm text-ink-secondary mt-1">AI-Powered Prescription Digitizer</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card-xl border border-slate-100 p-8 animate-fade-in">
          <h2 className="font-display text-xl font-bold text-ink mb-1">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-ink-muted mb-6">
            {isRegister ? "Sign up to start digitizing prescriptions" : "Sign in to your account"}
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4 animate-fade-in">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div className="animate-fade-in">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-secondary border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div className="animate-fade-in">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-secondary border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">E.164 format</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-secondary border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-secondary border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isRegister ? "Creating Account..." : "Signing In..."}
                </span>
              ) : (
                <>
                  {isRegister ? "Create Account" : "Sign In"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-ink-muted">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setIsRegister(!isRegister); setError(null); }}
                className="text-brand-600 font-semibold hover:underline"
              >
                {isRegister ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-center gap-3 mt-6 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            RAG Engine Active
          </span>
          <span>•</span>
          <span>AES-256 Encrypted</span>
          <span>•</span>
          <span>FDA Synced</span>
        </div>
      </div>
    </div>
  );
}
