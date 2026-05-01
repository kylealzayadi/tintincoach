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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex-1 flex flex-col mt-14 sm:mt-16 bg-background rounded-t-3xl overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border flex-shrink-0">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-card border border-border text-muted hover:text-white text-sm font-black transition active:scale-90">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
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
  const [activeModal, setActiveModal] = useState<"whoop" | "gear" | "notes" | null>(null);

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
  const recoveryColor = mergedWhoop.recovery != null
    ? mergedWhoop.recovery >= 67 ? "text-success" : mergedWhoop.recovery >= 34 ? "text-warning" : "text-danger"
    : "text-muted";
  const today = DAYS[new Date().getDay()];

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

            {/* Square overlay cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* WHOOP */}
              <button
                onClick={() => setActiveModal("whoop")}
                className="bg-card border-2 border-border rounded-2xl p-3 text-left transition-all active:scale-95 hover:border-accent aspect-square flex flex-col justify-between"
              >
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">WHOOP</p>
                <div>
                  {mergedWhoop.recovery != null ? (
                    <p className={`text-2xl sm:text-3xl font-black ${recoveryColor}`}>{mergedWhoop.recovery}%</p>
                  ) : (
                    <p className="text-lg font-black text-muted/40">—</p>
                  )}
                  {mergedWhoop.strain != null && (
                    <p className="text-[10px] font-bold text-muted mt-0.5">Strain {mergedWhoop.strain}</p>
                  )}
                  {mergedWhoop.sleep != null && (
                    <p className="text-[10px] font-bold text-muted">{mergedWhoop.sleep}h sleep</p>
                  )}
                </div>
              </button>

              {/* Gear */}
              <button
                onClick={() => setActiveModal("gear")}
                className="bg-card border-2 border-border rounded-2xl p-3 text-left transition-all active:scale-95 hover:border-accent aspect-square flex flex-col justify-between"
              >
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">Gear</p>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-pink">{today}</p>
                  <p className="text-[10px] font-bold text-muted mt-0.5">Tap to view</p>
                </div>
              </button>

              {/* Coach Notes */}
              <button
                onClick={() => setActiveModal("notes")}
                className="bg-card border-2 border-border rounded-2xl p-3 text-left transition-all active:scale-95 hover:border-accent aspect-square flex flex-col justify-between relative"
              >
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">Notes</p>
                {unreadNotes > 0 && (
                  <span className="absolute top-2 right-2 bg-danger text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotes}
                  </span>
                )}
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-accent">{notes.length}</p>
                  <p className="text-[10px] font-bold text-muted mt-0.5">{notes.length === 1 ? "note" : "notes"} today</p>
                </div>
              </button>
            </div>

            {log?.client_notes && (
              <div className="bg-card border-2 border-border rounded-2xl p-4">
                <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm font-bold whitespace-pre-wrap text-white">{log.client_notes}</p>
              </div>
            )}

            <TrendChart logs={recentLogs} />
          </>
        )}
      </main>

      {/* Modals */}
      {activeModal === "whoop" && (
        <Modal title="WHOOP" onClose={() => setActiveModal(null)}>
          <WhoopCard data={mergedWhoop} embedded />
        </Modal>
      )}
      {activeModal === "gear" && (
        <Modal title="Gear & Protocol" onClose={() => setActiveModal(null)}>
          <GearProtocol embedded />
        </Modal>
      )}
      {activeModal === "notes" && (
        <Modal title="Coach Notes" onClose={() => setActiveModal(null)}>
          <CoachNotes notes={notes} role="client" onUpdate={loadData} embedded />
        </Modal>
      )}
    </div>
  );
}
