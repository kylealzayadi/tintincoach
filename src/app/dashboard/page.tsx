"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, getLogsByDateRange, getCoachNotesByDate, getUnreadCountForClient, markNotesReadByClient } from "@/lib/store";
import type { DailyLog, CoachNote, WhoopData } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";
import MacroCards from "@/components/MacroCards";
import WhoopCard from "@/components/WhoopCard";
import GearList from "@/components/GearList";
import FoodList from "@/components/FoodList";
import ExerciseList from "@/components/ExerciseList";
import CoachNotes from "@/components/CoachNotes";
import TrendChart from "@/components/TrendChart";
import WhoopConnect, { getWhoopForDate } from "@/components/WhoopConnect";

const REFRESH_INTERVAL = 2 * 60 * 60 * 1000;

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

    const unreadIds = notesData.filter((n) => !n.read_by_client).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markNotesReadByClient(unreadIds);
      setUnreadCount((c) => Math.max(0, c - unreadIds.length));
    }

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

  return (
    <div className="min-h-screen pb-8">
      <Nav role="client" unreadCount={unreadCount} />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <span
                className="text-2xl sm:text-3xl font-black uppercase tracking-wider animate-rainbow"
                style={{
                  backgroundImage: "linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #00aaff, #8800ff, #ff00ff, #ff0000)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Client
              </span>
              <span>Dashboard</span>
            </h1>
            <p className="text-xs font-bold text-muted/60 mt-1">Auto-refreshes every 2 hrs for accuracy</p>
          </div>
          <DateSelector date={date} onChange={setDate} />
        </div>

        <WhoopConnect date={format(date, "yyyy-MM-dd")} onSync={loadData} />

        {loading ? (
          <p className="text-muted font-bold text-sm">Loading...</p>
        ) : (
          <>
            <MacroCards log={log} />
            <WhoopCard data={mergedWhoop} />
            <FoodList food={log?.food_json ?? []} />
            <ExerciseList exercises={log?.exercise_json ?? []} />
            <GearList gear={log?.gear_json ?? []} />

            {log?.client_notes && (
              <div className="bg-card border-2 border-border rounded-2xl p-4">
                <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm font-bold whitespace-pre-wrap text-white">{log.client_notes}</p>
              </div>
            )}

            <CoachNotes notes={notes} role="client" onUpdate={loadData} />
            <TrendChart logs={recentLogs} />
          </>
        )}
      </main>
    </div>
  );
}
