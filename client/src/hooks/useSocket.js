import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/**
 * useSocket — connects to the backend Socket.io server
 * and listens for job progress events.
 *
 * Usage:
 *   const { status, progress, logs, error } = useSocket(jobId);
 *
 * Backend emits these events on the job room:
 *   job:queued     → { jobId }
 *   job:processing → { jobId, step, progress (0-100) }
 *   job:completed  → { jobId, result }
 *   job:failed     → { jobId, error }
 *   log            → { time, level, msg }
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export function useSocket(jobId) {
  const socketRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | queued | processing | completed | failed
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    const socket = io(SOCKET_URL, {
      query: { jobId },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("[socket] connected"));
    socket.on("job:queued", () => setStatus("queued"));
    socket.on("job:processing", ({ step, progress }) => {
      setStatus("processing");
      setProgress(progress);
    });
    socket.on("job:completed", ({ result }) => {
      setStatus("completed");
      setResult(result);
      setProgress(100);
    });
    socket.on("job:failed", ({ error }) => {
      setStatus("failed");
      setError(error);
    });
    socket.on("log", (logEntry) => {
      setLogs((prev) => [...prev, logEntry]);
    });

    return () => socket.disconnect();
  }, [jobId]);

  return { status, progress, logs, result, error };
}
