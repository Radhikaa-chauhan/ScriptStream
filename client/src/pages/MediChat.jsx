import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Link, ExternalLink, AlertTriangle, ChevronRight } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";

const quickReplies = [
  "Tell me about side effects",
  "How should I take this?",
  "Is it safe with alcohol?",
  "Show clinical studies",
  "Missing a dose protocol",
];

const initialMessages = [
  {
    role: "assistant",
    text: "Hello Alex! I've analyzed your prescription for Amoxicillin 500mg. How can I help you understand this medication today?",
    time: "10:00 AM",
    context: "Context: Prescription #MS-882",
  },
];

const botResponses = {
  "Tell me about side effects": "Common side effects of Amoxicillin include nausea, diarrhea, and skin rash. Serious but rare effects include allergic reactions. Stop immediately if you experience difficulty breathing or severe skin reactions.",
  "How should I take this?": "Take Amoxicillin every 8 hours as prescribed. You can take it with or without food. Complete the full course even if symptoms improve early to prevent antibiotic resistance.",
  "Is it safe with alcohol?": "While alcohol doesn't directly interact with Amoxicillin, it can worsen side effects and impair your immune response. It's best to avoid alcohol during your treatment course.",
  "Show clinical studies": "Amoxicillin has extensive clinical backing. A 2022 meta-analysis confirmed 94% efficacy for bacterial infections when completing the full course. FDA classification: Category B for safety.",
  "Missing a dose protocol": "If you miss a dose, take it as soon as you remember. If it's almost time for your next dose, skip the missed one. Never double-dose. Set phone reminders to avoid missing future doses.",
};

const getTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export default function MediChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", text, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply =
        botResponses[text] ||
        "I'm analyzing your prescription context to give you the most accurate clinical information. Could you be more specific about your question?";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply, time: getTime(), context: "Context: Prescription #MS-882" },
      ]);
      setTyping(false);
    }, 1200);
  };

  return (
    <AppLayout>
      <div className="flex gap-5 h-[calc(100vh-112px)]">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
          {/* Chat header */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-ink flex items-center gap-2">
                <span className="text-base">💬</span>
                Conversation: Amoxicillin Context
              </p>
              <p className="text-xs text-ink-muted">FDA RAG Engine Active • 128-bit Clinical Encryption</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono bg-surface-secondary px-2.5 py-1 rounded-lg text-ink font-semibold border border-slate-100">
                Rx: MS-882
              </span>
              <button className="text-brand-600 font-semibold hover:underline">History</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {/* Welcome banner */}
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-ink flex items-center justify-center text-2xl shadow-lg">
                🤖
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-base text-ink">ScriptStream Clinical Assistant</p>
                <p className="text-sm text-ink-secondary mt-1">
                  Your personal drug expert. Ask about dosages,<br />interactions, and safety for your digitized prescriptions.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="badge-success text-xs">Clinically Verified</span>
                <span className="badge-blue text-xs">FDA Synced</span>
              </div>
            </div>

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-sm flex-shrink-0">
                    🤖
                  </div>
                )}
                <div className={`max-w-[70%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-600 text-white rounded-tr-sm"
                        : "bg-surface-secondary text-ink border border-slate-100 rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                    {msg.context && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-ink-muted">
                        <Link size={11} />
                        {msg.context}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-ink-muted px-1">{msg.time}</span>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    AJ
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-sm">🤖</div>
                <div className="bg-surface-secondary rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-100">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-slate-50">
            {quickReplies.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="flex-shrink-0 text-xs font-medium text-ink-secondary bg-surface-secondary border border-slate-200 px-3 py-1.5 rounded-full hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 flex gap-3 items-center">
            <div className="flex items-center gap-2 text-ink-muted px-1">
              <Link size={15} />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask about side effects, interactions, or dosage..."
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-ink-muted"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send Advice
              <Send size={13} />
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-[10px] text-ink-muted py-2 border-t border-slate-50 px-4">
            AI insights are based on FDA drug database data. Consult your pharmacist for final medical decisions.
          </p>
        </div>

        {/* Right panel: RAG reference */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto">
          <div className="card">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-brand-500 font-bold text-xs">✦</span>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wide">RAG Live Reference</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">💊</span>
              <h3 className="font-display font-bold text-base text-ink">Amoxicillin 500mg</h3>
            </div>
            <p className="text-xs text-ink-muted mb-3 leading-relaxed">
              Digital Clinical Assistant is referencing the latest drug database for your prescription.
            </p>

            <div className="bg-surface-secondary rounded-xl p-3 mb-3">
              <p className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-2">Linked Context</p>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-ink">1 capsule every 8 hours</p>
                  <p className="text-xs text-ink-muted">Dr. Sara</p>
                </div>
                <div className="text-right">
                  <p className="text-xs flex items-center gap-1 text-green-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Status: SAFE
                  </p>
                  <button className="text-[10px] text-brand-600 hover:underline mt-0.5">View Full</button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs">🕐</span>
                <p className="text-xs font-bold text-ink">Optimal Usage</p>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Take with food to prevent gastrointestinal upset. Complete the full course as prescribed (7 days) even if symptoms improve early. Avoid dairy products within 2 hours of ingestion.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 mt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs">⚠️</span>
                <p className="text-xs font-bold text-ink">Potential Interactions</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                <p className="text-xs text-amber-700">
                  <span className="font-bold">Warning:</span> Alcohol consumption may significantly increase the risk of dizziness and nausea.
                </p>
              </div>
              {[
                "Avoid taking with magnesium-based antacids.",
                "May decrease effectiveness of oral contraceptives.",
                "Moderate interaction with caffeine-rich beverages.",
              ].map((item, i) => (
                <p key={i} className="text-xs text-ink-secondary flex items-start gap-1.5 mt-1.5">
                  <span className="text-slate-400 mt-0.5 flex-shrink-0">•</span>
                  {item}
                </p>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-3">
              <button className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:underline">
                <ExternalLink size={11} />
                Open Official FDA Medication Guide
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Footer />
      </div>
    </AppLayout>
  );
}
