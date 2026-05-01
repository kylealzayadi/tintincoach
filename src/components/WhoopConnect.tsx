"use client";

import { useState, useEffect } from "react";

interface WhoopConnectProps {
  onData?: (data: { recovery?: number; strain?: number; sleep?: number }) => void;
  date?: string;
}

export default function WhoopConnect({ onData, date }: WhoopConnectProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("whoop") === "connected") {
      setConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("whoop") === "error") {
      setError("Failed to connect WHOOP. Try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const res = await fetch("/api/whoop/data");
      if (res.ok) setConnected(true);
    } catch { /* not connected */ }
  }

  async function syncData() {
    if (!date) return;
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch(`/api/whoop/data?date=${date}`);
      if (!res.ok) {
        if (res.status === 401) {
          setConnected(false);
          setError("WHOOP session expired. Reconnect.");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      const w = data.whoop;
      const hasData = w && (w.recovery != null || w.strain != null || w.sleep != null);
      if (hasData && onData) {
        onData(w);
        setStatus("Synced!");
      } else {
        setStatus(`No WHOOP data for ${date}`);
      }
    } catch {
      setError("Failed to fetch WHOOP data");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {!connected ? (
        <a
          href="/api/whoop/auth"
          className="inline-flex items-center gap-2 bg-card hover:bg-border border-2 border-border text-sm font-black px-4 py-2.5 rounded-xl transition-all active:scale-95"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
          Connect WHOOP
        </a>
      ) : (
        <>
          <span className="inline-flex items-center gap-2 text-xs font-black text-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            WHOOP
          </span>
          {date && (
            <button
              onClick={syncData}
              disabled={loading}
              className="text-xs font-black text-accent hover:text-accent-hover transition disabled:opacity-50 active:scale-95"
            >
              {loading ? "Syncing..." : "Sync"}
            </button>
          )}
        </>
      )}
      {error && <span className="text-xs font-bold text-danger">{error}</span>}
      {status && !error && <span className="text-xs font-bold text-success">{status}</span>}
    </div>
  );
}
