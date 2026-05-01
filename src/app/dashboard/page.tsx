"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, getLogsByDateRange, getCoachNotesByDate, getUnreadCountForClient } from "@/lib/store";
import type { DailyLog, CoachNote, WhoopData } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";
import MacroCards from "@/components/MacroCards";
import WhoopCard from "@/components/WhoopCard";
import GearProtocol from "@/components/GearProtocol";
import CoachNotes from "@/components/CoachNotes";
import TrendChart from "@/components/TrendChart";
import WhoopConnect, { getWhoopForDate } from "@/components/WhoopConnect";

const REFRESH_INTERVAL = 2 * 60 * 60 * 1000;

function Overlay({ title, badge, children, defaultOpen = false }: { title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-background transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white uppercase tracking-wider">{title}</span>
          {badge && (
            <span className="bg-danger text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase animate-pulse">{badge}</span>
          )}
        </div>
        <span className={`text-muted text-sm font-black transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [log, setLog] = useState<DailyLog | null>(null);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [whoopData, setWhoopData] = useState<WhoopData>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.role === "coach") { router.replace("/coach"); }
    window.scrollTo(0, 0);
  }, [auth, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const [logData, notesData, trendsData, unread] = await Promise.all([
      getLogByDate(dateStr),
      getCoachNotesByDate(dateStr),
      getLogsByDateRange(
        format(subDays(new Date(), 7), "yyyy-MM-dd"),
        format(new Date(), "yyyy-MM-dd")
      ),
      getUnreadCountForClient(),
    ]);
    setLog(logData);
    setNotes(notesData);
    setRecentLogs(trendsData);
    setUnreadCount(unread);
    setWhoopData(getWhoopForDate(dateStr) ?? {});
    setLoading(false);
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!auth || auth.role !== "client") return null;

  const mergedWhoop: WhoopData = {
    ...whoopData,
    recovery: whoopData.recovery ?? log?.whoop_json?.recovery,
    strain: whoopData.strain ?? log?.whoop_json?.strain,
    sleep: whoopData.sleep ?? log?.whoop_json?.sleep,
  };

  const unreadNotes = notes.filter((n) => !n.read_by_client).length;

  return (
    <div className="min-h-screen pb-8">
      <Nav role="client" unreadCount={unreadCount} />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-black uppercase tracking-wider animate-rainbow"
              style={{
                backgroundImage: "linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #00aaff, #8800ff, #ff00ff, #ff0000)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Client Dashboard
            </h1>
          </div>
          <DateSelector date={date} onChange={setDate} />
        </div>

        <WhoopConnect date={format(date, "yyyy-MM-dd")} onSync={loadData} />

        {loading ? (
          <p className="text-muted font-bold text-sm">Loading...</p>
        ) : (
          <>
            <MacroCards log={log} />

            <Overlay title="WHOOP">
              <WhoopCard data={mergedWhoop} embedded />
            </Overlay>

            <Overlay title="Gear & Protocol">
              <GearProtocol embedded />
            </Overlay>

            {log?.client_notes && (
              <div className="bg-card border-2 border-border rounded-2xl p-4">
                <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm font-bold whitespace-pre-wrap text-white">{log.client_notes}</p>
              </div>
            )}

            <Overlay title="Coach Notes" badge={unreadNotes > 0 ? `${unreadNotes} new` : undefined}>
              <CoachNotes notes={notes} role="client" onUpdate={loadData} embedded />
            </Overlay>

            <TrendChart logs={recentLogs} />
          </>
        )}
      </main>
    </div>
  );
}
