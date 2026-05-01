"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import GearProtocol, { GEAR_DAYS, GEAR_SCHEDULE } from "@/components/GearProtocol";
import CoachNotes from "@/components/CoachNotes";
import TrendChart from "@/components/TrendChart";
import WhoopConnect, { getWhoopForDate } from "@/components/WhoopConnect";

const MEALS = ["Breakfast", "AM Snack", "Lunch", "PM Snack", "Dinner"] as const;

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
  const [viewMode, setViewMode] = useState<"coach" | "client">("coach");
  const [expanded, setExpanded] = useState<"whoop" | "gear" | "notes" | null>(null);
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const mealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function selectMeal(meal: string | null) {
    if (mealTimer.current) clearTimeout(mealTimer.current);
    setActiveMeal(meal);
    if (meal) {
      mealTimer.current = setTimeout(() => setActiveMeal(null), 5000);
    }
  }

  useEffect(() => {
    return () => { if (mealTimer.current) clearTimeout(mealTimer.current); };
  }, []);

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

  const unreadNotes = notes.filter((n) => !n.read_by_coach && n.reply).length;
  const recoveryColor = mergedWhoop.recovery != null
    ? mergedWhoop.recovery >= 67 ? "text-success" : mergedWhoop.recovery >= 34 ? "text-warning" : "text-danger"
    : "text-muted";
  const selectedDay = GEAR_DAYS[date.getDay()];
  const selectedGear = GEAR_SCHEDULE[selectedDay];
  const gearCount = selectedGear.injections.length + selectedGear.oral.length;

  return (
    <div className="min-h-screen pb-8">
      <Nav role="coach" unreadCount={unreadCount} />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/coach")}
              className="bg-accent hover:bg-accent-hover px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-95 hover:shadow-[0_0_20px_var(--color-accent-glow)]"
            >
              <span
                className="animate-rainbow"
                style={{
                  backgroundImage: "linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #00aaff, #8800ff, #ff00ff, #ff0000)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Coach Dashboard
              </span>
            </button>
            <div className="flex bg-card border-2 border-border rounded-xl overflow-hidden">
              <button
                onClick={() => { setViewMode("client"); setExpanded(null); }}
                title="Card View"
                className={`px-2.5 py-2 transition-all ${viewMode === "client" ? "bg-accent text-white" : "text-muted hover:text-white"}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => { setViewMode("coach"); setExpanded(null); }}
                title="Expanded View"
                className={`px-2.5 py-2 transition-all ${viewMode === "coach" ? "bg-accent text-white" : "text-muted hover:text-white"}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="4" x2="21" y2="4" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="14" x2="21" y2="14" />
                  <line x1="3" y1="19" x2="15" y2="19" />
                </svg>
              </button>
            </div>
          </div>
          <DateSelector date={date} onChange={setDate} />
        </div>

        {loading ? (
          <p className="text-muted font-bold text-sm">Loading...</p>
        ) : viewMode === "client" ? (
          /* ── Client View ── */
          <>
            {/* Meal time buttons */}
            <div className="space-y-2">
              <div className="flex gap-1.5 overflow-x-auto">
                {MEALS.map((meal) => {
                  const entry = log?.meals_json?.find((m) => m.meal === meal);
                  const hasData = entry && (entry.calories || entry.protein || entry.carbs || entry.fats || entry.description);
                  const isActive = activeMeal === meal;
                  return (
                    <button
                      key={meal}
                      onClick={() => selectMeal(isActive ? null : meal)}
                      className={`flex-1 min-w-0 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                        isActive
                          ? "bg-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]"
                          : hasData
                            ? "bg-card border-2 border-success/40 text-success"
                            : "bg-card border-2 border-border text-muted"
                      }`}
                    >
                      {meal === "AM Snack" ? "AM Snack" : meal === "PM Snack" ? "PM Snack" : meal === "Breakfast" ? "Bfast" : meal}
                    </button>
                  );
                })}
              </div>
              {activeMeal ? (() => {
                const entry = log?.meals_json?.find((m) => m.meal === activeMeal);
                const hasData = entry && (entry.calories || entry.protein || entry.carbs || entry.fats || entry.description);
                return (
                  <div className="bg-card border-2 border-border rounded-2xl p-3">
                    <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2">{activeMeal}</p>
                    {hasData ? (
                      <div>
                        <div className="flex gap-3 text-xs font-bold">
                          <span><span className="text-white">{entry!.calories ?? 0}</span><span className="text-muted ml-0.5">cal</span></span>
                          <span><span className="text-cyan">{entry!.protein ?? 0}</span><span className="text-cyan/60 ml-0.5">p</span></span>
                          <span><span className="text-warning">{entry!.carbs ?? 0}</span><span className="text-warning/60 ml-0.5">c</span></span>
                          <span><span className="text-pink">{entry!.fats ?? 0}</span><span className="text-pink/60 ml-0.5">f</span></span>
                        </div>
                        {entry!.description && (
                          <p className="text-xs font-bold text-muted/70 mt-1.5">{entry!.description}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-muted/50">Not yet</p>
                    )}
                  </div>
                );
              })() : (
                <div className="bg-card border-2 border-border rounded-2xl p-3 flex items-center justify-between">
                  <p className="text-[10px] font-black text-muted uppercase tracking-wider">Total Macros</p>
                  <div className="flex gap-3 text-xs font-bold">
                    <span><span className="text-white">{log?.calories ?? 0}</span><span className="text-muted ml-0.5">cal</span></span>
                    <span><span className="text-cyan">{log?.protein ?? 0}</span><span className="text-cyan/60 ml-0.5">p</span></span>
                    <span><span className="text-warning">{log?.carbs ?? 0}</span><span className="text-warning/60 ml-0.5">c</span></span>
                    <span><span className="text-pink">{log?.fats ?? 0}</span><span className="text-pink/60 ml-0.5">f</span></span>
                  </div>
                </div>
              )}
            </div>

            <MacroCards log={log} selectedMeal={activeMeal} clientNotes={log?.client_notes} />

            <div className="grid grid-cols-3 gap-3">
              {/* WHOOP */}
              <button
                onClick={() => setExpanded(expanded === "whoop" ? null : "whoop")}
                className={`bg-card border-2 rounded-2xl p-3 text-left transition-all active:scale-95 aspect-square flex flex-col ${expanded === "whoop" ? "border-accent" : "border-border hover:border-accent"}`}
              >
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">WHOOP</p>
                <div className="flex-1 flex flex-col justify-evenly">
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Recovery</p>
                    {mergedWhoop.recovery != null ? (
                      <p className={`text-lg font-black leading-tight ${recoveryColor}`}>{mergedWhoop.recovery}%</p>
                    ) : (
                      <p className="text-lg font-black text-muted/40 leading-tight">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Strain</p>
                    {mergedWhoop.strain != null ? (
                      <p className="text-lg font-black text-cyan leading-tight">{mergedWhoop.strain}</p>
                    ) : (
                      <p className="text-lg font-black text-muted/40 leading-tight">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Sleep</p>
                    {mergedWhoop.sleep != null ? (
                      <p className="text-lg font-black text-blue-400 leading-tight">{mergedWhoop.sleep}h</p>
                    ) : (
                      <p className="text-lg font-black text-muted/40 leading-tight">—</p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-muted">Tap to view</p>
              </button>

              {/* Gear */}
              <button
                onClick={() => setExpanded(expanded === "gear" ? null : "gear")}
                className={`bg-card border-2 rounded-2xl p-3 text-left transition-all active:scale-95 aspect-square flex flex-col ${expanded === "gear" ? "border-accent" : "border-border hover:border-accent"}`}
              >
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">Gear</p>
                <div className="flex-1 flex flex-col justify-evenly">
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Today</p>
                    <p className="text-lg font-black text-pink leading-tight">{selectedDay}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Injections</p>
                    <p className="text-lg font-black text-cyan leading-tight">{selectedGear.injections.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Items</p>
                    <p className="text-lg font-black text-warning leading-tight">{gearCount}</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-muted">Tap to view</p>
              </button>

              {/* Coach Notes */}
              <button
                onClick={() => setExpanded(expanded === "notes" ? null : "notes")}
                className={`bg-card border-2 rounded-2xl p-3 text-left transition-all active:scale-95 aspect-square flex flex-col relative ${expanded === "notes" ? "border-accent" : "border-border hover:border-accent"}`}
              >
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">Your Notes</p>
                {unreadNotes > 0 && (
                  <span className="absolute top-2 right-2 bg-danger text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotes}
                  </span>
                )}
                <div className="flex-1 flex flex-col justify-evenly">
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Today</p>
                    <p className="text-lg font-black text-accent leading-tight">{notes.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Unread</p>
                    <p className={`text-lg font-black leading-tight ${unreadNotes > 0 ? "text-danger" : "text-muted/40"}`}>{unreadNotes}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">Status</p>
                    <p className={`text-xs font-black leading-tight ${unreadNotes > 0 ? "text-danger" : "text-success"}`}>{unreadNotes > 0 ? "New" : "Read"}</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-muted">Tap to view</p>
              </button>
            </div>

            {expanded === "whoop" && <WhoopCard data={mergedWhoop} />}
            {expanded === "gear" && <GearProtocol date={date} />}
            {expanded === "notes" && <CoachNotes notes={notes} role="coach" onUpdate={loadData} />}

            <TrendChart logs={recentLogs} />
          </>
        ) : !log && !whoopForDay.recovery ? (
          /* ── Coach View: No data ── */
          <>
            <div className="bg-card border-2 border-border rounded-2xl p-8 text-center">
              <p className="text-muted font-bold text-lg">No data logged for this day</p>
            </div>

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
          </>
        ) : (
          /* ── Coach View: Has data ── */
          <>
            {/* Meal time buttons */}
            <div className="space-y-2">
              <div className="flex gap-1.5 overflow-x-auto">
                {MEALS.map((meal) => {
                  const entry = log?.meals_json?.find((m) => m.meal === meal);
                  const hasData = entry && (entry.calories || entry.protein || entry.carbs || entry.fats || entry.description);
                  const isActive = activeMeal === meal;
                  return (
                    <button
                      key={meal}
                      onClick={() => selectMeal(isActive ? null : meal)}
                      className={`flex-1 min-w-0 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                        isActive
                          ? "bg-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]"
                          : hasData
                            ? "bg-card border-2 border-success/40 text-success"
                            : "bg-card border-2 border-border text-muted"
                      }`}
                    >
                      {meal === "AM Snack" ? "AM Snack" : meal === "PM Snack" ? "PM Snack" : meal === "Breakfast" ? "Bfast" : meal}
                    </button>
                  );
                })}
              </div>
              {activeMeal ? (() => {
                const entry = log?.meals_json?.find((m) => m.meal === activeMeal);
                const hasData = entry && (entry.calories || entry.protein || entry.carbs || entry.fats || entry.description);
                return (
                  <div className="bg-card border-2 border-border rounded-2xl p-3">
                    <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2">{activeMeal}</p>
                    {hasData ? (
                      <div>
                        <div className="flex gap-3 text-xs font-bold">
                          <span><span className="text-white">{entry!.calories ?? 0}</span><span className="text-muted ml-0.5">cal</span></span>
                          <span><span className="text-cyan">{entry!.protein ?? 0}</span><span className="text-cyan/60 ml-0.5">p</span></span>
                          <span><span className="text-warning">{entry!.carbs ?? 0}</span><span className="text-warning/60 ml-0.5">c</span></span>
                          <span><span className="text-pink">{entry!.fats ?? 0}</span><span className="text-pink/60 ml-0.5">f</span></span>
                        </div>
                        {entry!.description && (
                          <p className="text-xs font-bold text-muted/70 mt-1.5">{entry!.description}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-muted/50">Not yet</p>
                    )}
                  </div>
                );
              })() : (
                <div className="bg-card border-2 border-border rounded-2xl p-3 flex items-center justify-between">
                  <p className="text-[10px] font-black text-muted uppercase tracking-wider">Total Macros</p>
                  <div className="flex gap-3 text-xs font-bold">
                    <span><span className="text-white">{log?.calories ?? 0}</span><span className="text-muted ml-0.5">cal</span></span>
                    <span><span className="text-cyan">{log?.protein ?? 0}</span><span className="text-cyan/60 ml-0.5">p</span></span>
                    <span><span className="text-warning">{log?.carbs ?? 0}</span><span className="text-warning/60 ml-0.5">c</span></span>
                    <span><span className="text-pink">{log?.fats ?? 0}</span><span className="text-pink/60 ml-0.5">f</span></span>
                  </div>
                </div>
              )}
            </div>

            {log && <MacroCards log={log} selectedMeal={activeMeal} clientNotes={log?.client_notes} />}
            <WhoopCard data={mergedWhoop} />
            <GearProtocol date={date} />

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
          </>
        )}
      </main>
    </div>
  );
}
