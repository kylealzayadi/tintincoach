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
import CoachNotes from "@/components/CoachNotes";
import TrendChart from "@/components/TrendChart";
import WhoopConnect from "@/components/WhoopConnect";

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

  if (!auth || auth.role !== "client") return null;

  return (
    <div className="min-h-screen">
      <Nav role="client" />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <DateSelector date={date} onChange={setDate} />
        </div>

        <WhoopConnect date={format(date, "yyyy-MM-dd")} />

        <MacroCards log={log} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <WhoopCard data={log?.whoop_json ?? {}} />
          <GearList gear={log?.gear_json ?? []} />
        </div>

        {log?.client_notes && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted mb-2">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{log.client_notes}</p>
          </div>
        )}

        <CoachNotes notes={notes} />
        <TrendChart logs={recentLogs} />
      </main>
    </div>
  );
}
