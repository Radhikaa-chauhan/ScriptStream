import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white mt-auto py-3 px-6 flex items-center justify-between text-xs text-ink-muted">
      <span>© 2024 ScriptStream • RAG-Engine v2.4.0</span>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Drug Database Live
        </span>
        <a href="#" className="hover:text-ink transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-ink transition-colors">Clinical Terms</a>
      </div>
    </footer>
  );
}
