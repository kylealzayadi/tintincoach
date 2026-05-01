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
      if (res.ok) {
        setConnected(true);
      }
    } catch {
      // not connected
    }
  }

  async function syncData() {
    if (!date) return;
    setLoading(true);
    setError("");
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
        setStatus(`No WHOOP data found for ${date}`);
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
          className="inline-flex items-center gap-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] border border-border text-sm px-4 py-2 rounded-lg transition"
        >
          <span className="w-2 h-2 rounded-full bg-warning" />
          Connect WHOOP
        </a>
      ) : (
        <>
          <span className="inline-flex items-center gap-2 text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-success" />
            WHOOP connected
          </span>
          {date && (
            <button
              onClick={syncData}
              disabled={loading}
              className="text-xs text-accent hover:text-accent-hover transition disabled:opacity-50"
            >
              {loading ? "Syncing..." : "Sync today"}
            </button>
          )}
        </>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
      {status && !error && <span className="text-xs text-muted">{status}</span>}
    </div>
  );
}
