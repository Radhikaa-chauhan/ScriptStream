import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ShieldCheck,
  Plus,
  Settings,
  LogOut,
  Activity,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Prescriptions", icon: FileText, path: "/prescriptions" },
  { label: "ScriptChat", icon: MessageSquare, path: "/chat" },
  { label: "Admin Ops", icon: ShieldCheck, path: "/admin" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-slate-100 flex flex-col py-5 px-3 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-3 mb-8 cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
          <Activity size={16} className="text-white" />
        </div>
        <span className="font-display font-bold text-ink text-base tracking-tight">
          ScriptStream
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={pathname.startsWith(path) ? "nav-item-active" : "nav-item"}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {/* New Upload CTA */}
      <div className="px-1 mb-4">
        <button
          onClick={() => navigate("/upload")}
          className="w-full btn-primary justify-center text-sm"
        >
          <Plus size={16} />
          New Upload
        </button>
      </div>

      {/* Bottom links */}
      <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
        <button className="nav-item">
          <Settings size={16} />
          Settings
        </button>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="nav-item text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
