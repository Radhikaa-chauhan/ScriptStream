import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar />
      <div className="ml-[220px]">
        <Topbar />
        <main className="pt-14 min-h-screen">
          <div className="p-6 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
