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
} from "@/lib/store";
import type { DailyLog, CoachNote } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";
import MacroCards from "@/components/MacroCards";
import WhoopCard from "@/components/WhoopCard";
import GearList from "@/components/GearList";
import FoodList from "@/components/FoodList";
import ExerciseList from "@/components/ExerciseList";
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
  const [newNote, setNewNote] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastViewed] = useState(() => {
    if (typeof window === "undefined") return null;
    const ts = localStorage.getItem("tintin_coach_last_viewed");
    localStorage.setItem("tintin_coach_last_viewed", new Date().toISOString());
    return ts;
  });

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.role !== "coach") { router.replace("/dashboard"); }
  }, [auth, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const [logData, notesData, trendsData] = await Promise.all([
      getLogByDate(dateStr),
      getCoachNotesByDate(dateStr),
      getLogsByDateRange(
        format(subDays(new Date(), 7), "yyyy-MM-dd"),
        format(new Date(), "yyyy-MM-dd")
      ),
    ]);
    setLog(logData);
    setNotes(notesData);
    setRecentLogs(trendsData);
    setLoading(false);
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

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

  return (
    <div className="min-h-screen pb-8">
      <Nav role="coach" />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-black">Coach View</h1>
            {lastViewed && (
              <p className="text-xs font-bold text-muted mt-1">
                Last viewed: {format(new Date(lastViewed), "MMM d, h:mm a")}
              </p>
            )}
          </div>
          <DateSelector date={date} onChange={setDate} />
        </div>

        {loading ? (
          <p className="text-muted font-bold text-sm">Loading...</p>
        ) : !log ? (
          <div className="bg-card border-2 border-border rounded-2xl p-8 text-center">
            <p className="text-muted font-bold text-lg">No data logged for this day</p>
          </div>
        ) : (
          <>
            <MacroCards log={log} />
            <WhoopCard data={log.whoop_json ?? {}} />
            <FoodList food={log.food_json ?? []} />
            <ExerciseList exercises={log.exercise_json ?? []} />
            <GearList gear={log.gear_json ?? []} />

            {log.client_notes && (
              <div className="bg-card border-2 border-border rounded-2xl p-4">
                <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Client Notes</h3>
                <p className="text-sm font-bold whitespace-pre-wrap text-white">{log.client_notes}</p>
              </div>
            )}
          </>
        )}

        <CoachNotes notes={notes} />

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
