"use client";

import { useState, useEffect } from "react";

interface WhoopConnectProps {
  onSync?: () => void;
  date?: string;
}

function getWhoopCache(): Record<string, { recovery?: number; strain?: number; sleep?: number }> {
  try {
    return JSON.parse(localStorage.getItem("tintin_whoop") || "{}");
  } catch {
    return {};
  }
}

export function getWhoopForDate(date: string): { recovery?: number; strain?: number; sleep?: number } | null {
  const cache = getWhoopCache();
  return cache[date] ?? null;
}

export default function WhoopConnect({ onSync, date }: WhoopConnectProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("whoop") === "connected") {
      setConnected(true);
      syncAll();
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
        const data = await res.json();
        if (data.connected) {
          setConnected(true);
          if (data.days) {
            localStorage.setItem("tintin_whoop", JSON.stringify(data.days));
          }
        }
      }
    } catch { /* not connected */ }
  }

  async function syncAll() {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/whoop/data");
      if (!res.ok) {
        if (res.status === 401) {
          setConnected(false);
          setError("WHOOP session expired. Reconnect.");
        } else {
          setError("Sync failed");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.days) {
        const dayCount = Object.keys(data.days).length;
        localStorage.setItem("tintin_whoop", JSON.stringify(data.days));
        setStatus(`Synced ${dayCount} days`);
        if (onSync) onSync();
      } else {
        setStatus("No WHOOP data found");
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
          <button
            onClick={syncAll}
            disabled={loading}
            className="text-xs font-black text-accent hover:text-accent-hover transition disabled:opacity-50 active:scale-95"
          >
            {loading ? "Syncing..." : "Sync All"}
          </button>
          {date && (
            <span className="text-xs font-bold text-muted">
              {getWhoopForDate(date) ? "Data available" : "No data for this day"}
            </span>
          )}
        </>
      )}
      {error && <span className="text-xs font-bold text-danger">{error}</span>}
      {status && !error && <span className="text-xs font-bold text-success">{status}</span>}
    </div>
  );
}
