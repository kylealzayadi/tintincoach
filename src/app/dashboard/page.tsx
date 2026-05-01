"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, getLogsByDateRange, getCoachNotesByDate } from "@/lib/local-store";
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
import WhoopConnect from "@/components/WhoopConnect";

const REFRESH_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours

export default function DashboardPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [log, setLog] = useState<DailyLog | null>(null);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
      return;
    }
    if (auth.role === "coach") {
      router.replace("/coach");
    }
  }, [auth, router]);

  function loadData() {
    const dateStr = format(date, "yyyy-MM-dd");
    setLog(getLogByDate(dateStr));
    setNotes(getCoachNotesByDate(dateStr));
    const today = format(new Date(), "yyyy-MM-dd");
    const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    setRecentLogs(getLogsByDateRange(weekAgo, today));
  }

  useEffect(() => {
    loadData();
  }, [date]);

  useEffect(() => {
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [date]);

  if (!auth || auth.role !== "client") return null;

  return (
    <div className="min-h-screen pb-8">
      <Nav role="client" />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-black">Dashboard</h1>
          <DateSelector date={date} onChange={setDate} />
        </div>

        <WhoopConnect date={format(date, "yyyy-MM-dd")} />

        <MacroCards log={log} />

        <WhoopCard data={log?.whoop_json ?? {}} />

        <FoodList food={log?.food_json ?? []} />

        <ExerciseList exercises={log?.exercise_json ?? []} />

        <GearList gear={log?.gear_json ?? []} />

        {log?.client_notes && (
          <div className="bg-card border-2 border-border rounded-2xl p-4">
            <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Notes</h3>
            <p className="text-sm font-bold whitespace-pre-wrap text-white">{log.client_notes}</p>
          </div>
        )}

        <CoachNotes notes={notes} />
        <TrendChart logs={recentLogs} />
      </main>
    </div>
  );
}
