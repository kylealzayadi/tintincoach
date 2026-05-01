"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getLogByDate,
  getLogsByDateRange,
  getCoachNotesByDate,
  addCoachNote,
  getUnreadCountForCoach,
} from "@/lib/store";
import type { DailyLog, CoachNote, WhoopData } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";
import MacroCards from "@/components/MacroCards";
import WhoopCard from "@/components/WhoopCard";
import FoodList from "@/components/FoodList";
import GearProtocol from "@/components/GearProtocol";
import CoachNotes from "@/components/CoachNotes";
import TrendChart from "@/components/TrendChart";

const REFRESH_INTERVAL = 2 * 60 * 60 * 1000;

export default function CoachPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [log, setLog] = useState<DailyLog | null>(null);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [whoopDays, setWhoopDays] = useState<Record<string, WhoopData>>({});
  const [newNote, setNewNote] = useState("");
  const [posting, setPosting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.role !== "coach") { router.replace("/dashboard"); }
    window.scrollTo(0, 0);
  }, [auth, router]);

  const fetchWhoop = useCallback(async () => {
    try {
      const res = await fetch("/api/whoop/data");
      if (res.ok) {
        const data = await res.json();
        if (data.days) setWhoopDays(data.days);
      }
    } catch { /* WHOOP not connected */ }
  }, []);

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
      getUnreadCountForCoach(),
    ]);
    setLog(logData);
    setNotes(notesData);
    setRecentLogs(trendsData);
    setUnreadCount(unread);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    loadData();
    fetchWhoop();
  }, [loadData, fetchWhoop]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
      fetchWhoop();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData, fetchWhoop]);

  async function handleSubmitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setPosting(true);
    await addCoachNote(format(date, "yyyy-MM-dd"), newNote.trim());
    setNewNote("");
    setPosting(false);
    loadData();
  }

  if (!auth || auth.role !== "coach") return null;

  const dateStr = format(date, "yyyy-MM-dd");
  const whoopForDay = whoopDays[dateStr] ?? {};
  const mergedWhoop: WhoopData = {
    ...whoopForDay,
    recovery: whoopForDay.recovery ?? log?.whoop_json?.recovery,
    strain: whoopForDay.strain ?? log?.whoop_json?.strain,
    sleep: whoopForDay.sleep ?? log?.whoop_json?.sleep,
  };

  return (
    <div className="min-h-screen pb-8">
      <Nav role="coach" unreadCount={unreadCount} />
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
              Coach View
            </h1>
          </div>
          <DateSelector date={date} onChange={setDate} />
        </div>

        {loading ? (
          <p className="text-muted font-bold text-sm">Loading...</p>
        ) : !log && !whoopForDay.recovery ? (
          <div className="bg-card border-2 border-border rounded-2xl p-8 text-center">
            <p className="text-muted font-bold text-lg">No data logged for this day</p>
          </div>
        ) : (
          <>
            {log && <MacroCards log={log} />}
            <WhoopCard data={mergedWhoop} />
            {log && <FoodList food={log.food_json ?? []} />}
            <GearProtocol />

            {log?.client_notes && (
              <div className="bg-card border-2 border-border rounded-2xl p-4">
                <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Client Notes</h3>
                <p className="text-sm font-bold whitespace-pre-wrap text-white">{log.client_notes}</p>
              </div>
            )}
          </>
        )}

        <CoachNotes notes={notes} role="coach" onUpdate={loadData} />

        <div className="bg-card border-2 border-border rounded-2xl p-4">
          <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-3">Add Note</h3>
          <form onSubmit={handleSubmitNote} className="space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              placeholder="Write a note for your client..."
              className="w-full bg-background border-2 border-border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-accent focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all resize-none placeholder:text-muted/50"
            />
            <button
              type="submit"
              disabled={!newNote.trim() || posting}
              className="w-full bg-accent hover:bg-accent-hover text-white rounded-2xl px-6 py-4 text-base font-black uppercase tracking-wider transition-all hover:shadow-[0_0_30px_var(--color-accent-glow)] active:scale-[0.98] disabled:opacity-50"
            >
              {posting ? "Posting..." : "Post Note"}
            </button>
          </form>
        </div>

        <TrendChart logs={recentLogs} />
      </main>
    </div>
  );
}
