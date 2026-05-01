"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getLogByDate,
  getLogsByDateRange,
  getCoachNotesByDate,
  addCoachNote,
} from "@/lib/local-store";
import type { DailyLog, CoachNote } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";
import MacroCards from "@/components/MacroCards";
import WhoopCard from "@/components/WhoopCard";
import GearList from "@/components/GearList";
import CoachNotes from "@/components/CoachNotes";
import TrendChart from "@/components/TrendChart";

export default function CoachPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [log, setLog] = useState<DailyLog | null>(null);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [newNote, setNewNote] = useState("");
  const [lastViewed] = useState(() => {
    if (typeof window === "undefined") return null;
    const ts = localStorage.getItem("tintin_coach_last_viewed");
    localStorage.setItem("tintin_coach_last_viewed", new Date().toISOString());
    return ts;
  });

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
      return;
    }
    if (auth.role !== "coach") {
      router.replace("/dashboard");
    }
  }, [auth, router]);

  useEffect(() => {
    const dateStr = format(date, "yyyy-MM-dd");
    setLog(getLogByDate(dateStr));
    setNotes(getCoachNotesByDate(dateStr));
  }, [date]);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    setRecentLogs(getLogsByDateRange(weekAgo, today));
  }, []);

  function handleSubmitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    addCoachNote(format(date, "yyyy-MM-dd"), newNote.trim());
    setNewNote("");
    setNotes(getCoachNotesByDate(format(date, "yyyy-MM-dd")));
  }

  if (!auth || auth.role !== "coach") return null;

  return (
    <div className="min-h-screen">
      <Nav role="coach" />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Coach View</h1>
            {lastViewed && (
              <p className="text-xs text-muted">
                Last viewed: {format(new Date(lastViewed), "MMM d, h:mm a")}
              </p>
            )}
          </div>
          <DateSelector date={date} onChange={setDate} />
        </div>

        {!log ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-muted">No data logged for this day</p>
          </div>
        ) : (
          <>
            <MacroCards log={log} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <WhoopCard data={log.whoop_json ?? {}} />
              <GearList gear={log.gear_json ?? []} />
            </div>

            {log.client_notes && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-medium text-muted mb-2">Client Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{log.client_notes}</p>
              </div>
            )}
          </>
        )}

        <CoachNotes notes={notes} />

        {/* Add note */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted mb-3">Add Note</h3>
          <form onSubmit={handleSubmitNote} className="space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              placeholder="Write a note for your client..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="bg-accent hover:bg-accent-hover text-white rounded-lg px-6 py-2 text-sm font-medium transition disabled:opacity-50"
            >
              Post Note
            </button>
          </form>
        </div>

        <TrendChart logs={recentLogs} />
      </main>
    </div>
  );
}
