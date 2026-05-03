import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/**
 * useSocket — connects to the backend Socket.io server
 * and listens for LangGraph AI status events.
 *
 * Backend emits: ai_status → { status, log, timestamp }
 *
 * status values emitted by nodes:
 *   "processing" | "success" | "warning" | "waiting" | "completed" | "failed"
 */

const SOCKET_URL = "http://localhost:8001";

export function useSocket(jobId) {
  const socketRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);   // array of { time, level, msg }
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connect even without a jobId so we can receive broadcast updates
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("[socket] connected"));

    // ── Primary event from LangGraph nodes ──────────────────────────────
    socket.on("ai_status", ({ status: s, log, timestamp }) => {
      // Map server status → UI status
      if (s === "completed" || s === "done") setStatus("completed");
      else if (s === "failed") setStatus("failed");
      else if (s === "waiting" || s === "awaiting_verification") setStatus("waiting"); // paused at verification
      else setStatus("processing");

      // Fake progress based on known steps
      if (s === "success") setProgress((p) => Math.min(p + 15, 90));

      // Normalize log to { time, level, msg } shape Processing.jsx expects
      const now = timestamp ? new Date(timestamp) : new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false });

      let level = "INFO";
      if (s === "success") level = "SUCCESS";
      else if (s === "warning") level = "WARN";
      else if (s === "failed" || s === "error") level = "ERROR";
      else if (s === "waiting" || s === "awaiting_verification") level = "WAIT";

      setLogs((prev) => [...prev, { time: timeStr, level, msg: log }]);
    });

    // Legacy event names (keep for compatibility)
    socket.on("job:queued", () => setStatus("queued"));
    socket.on("job:processing", ({ progress: p }) => {
      setStatus("processing");
      if (p != null) setProgress(p);
    });
    socket.on("job:completed", ({ result: r }) => {
      setStatus("completed");
      setResult(r);
      setProgress(100);
    });
    socket.on("job:failed", ({ error: e }) => {
      setStatus("failed");
      setError(e);
    });

    return () => socket.disconnect();
  }, []); // intentionally no jobId dep — server broadcasts to all

  return { status, progress, logs, result, error };
}
