import React from "react";
import { Bell, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

export default function Topbar() {
  const { user } = useAuth();
  const { notifications } = useApp();

  const displayName = user?.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-4 fixed top-0 left-[220px] right-0 z-20">
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="text"
          placeholder="Search medications or history..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-surface-secondary border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* Bell */}
        <button className="relative p-2 rounded-xl hover:bg-surface-secondary transition-colors">
          <Bell size={18} className="text-ink-secondary" />
          {notifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-ink leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-ink-muted">
              {user?.email || ""}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold border-2 border-brand-100">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
