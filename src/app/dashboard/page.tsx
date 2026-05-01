"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, getLogsByDateRange, getCoachNotesByDate, getUnreadCountForClient } from "@/lib/store";
import type { DailyLog, CoachNote, WhoopData } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";
import MacroCards from "@/components/MacroCards";
import WhoopCard from "@/components/WhoopCard";
import GearProtocol, { GEAR_DAYS, GEAR_SCHEDULE } from "@/components/GearProtocol";
import CoachNotes from "@/components/CoachNotes";
import TrendChart from "@/components/TrendChart";
import WhoopConnect, { getWhoopForDate } from "@/components/WhoopConnect";

const REFRESH_INTERVAL = 2 * 60 * 60 * 1000;
const MEALS = ["Breakfast", "AM Snack", "Lunch", "PM Snack", "Dinner"] as const;

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
  const [expanded, setExpanded] = useState<"whoop" | "gear" | "notes" | null>(null);
  const [viewMode, setViewMode] = useState<"overlay" | "expanded">("overlay");
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
  const selectedDay = GEAR_DAYS[date.getDay()];
  const selectedGear = GEAR_SCHEDULE[selectedDay];
  const gearCount = selectedGear.injections.length + selectedGear.oral.length;

  return (
    <div className="min-h-screen pb-8">
      <Nav role="client" unreadCount={unreadCount} />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
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
                Client Dashboard
              </span>
            </button>
            <div className="flex bg-card border-2 border-border rounded-xl overflow-hidden">
              <button
                onClick={() => { setViewMode("overlay"); setExpanded(null); }}
                title="Card View"
                className={`px-2.5 py-2 transition-all ${viewMode === "overlay" ? "bg-accent text-white" : "text-muted hover:text-white"}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => { setViewMode("expanded"); setExpanded(null); }}
                title="Expanded View"
                className={`px-2.5 py-2 transition-all ${viewMode === "expanded" ? "bg-accent text-white" : "text-muted hover:text-white"}`}
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

        <WhoopConnect date={format(date, "yyyy-MM-dd")} onSync={loadData} />

        {loading ? (
          <p className="text-muted font-bold text-sm">Loading...</p>
        ) : viewMode === "overlay" ? (
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
                        {entry!.description && (
                          <p className="text-xs font-bold text-muted/70">{entry!.description}</p>
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

            <MacroCards log={log} selectedMeal={activeMeal} />

            {/* Square overlay cards */}
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
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">Notes</p>
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

            {/* Inline expanded content */}
            {expanded === "whoop" && <WhoopCard data={mergedWhoop} />}
            {expanded === "gear" && <GearProtocol date={date} />}
            {expanded === "notes" && <CoachNotes notes={notes} role="client" onUpdate={loadData} />}

            {log?.client_notes && (
              <div className="bg-card border-2 border-border rounded-2xl p-4">
                <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm font-bold whitespace-pre-wrap text-white">{log.client_notes}</p>
              </div>
            )}

            <TrendChart logs={recentLogs} />
          </>
        ) : (
          /* ── Expanded View ── */
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
                        {entry!.description && (
                          <p className="text-xs font-bold text-muted/70">{entry!.description}</p>
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

            <MacroCards log={log} selectedMeal={activeMeal} />
            <WhoopCard data={mergedWhoop} />
            <GearProtocol date={date} />
            <CoachNotes notes={notes} role="client" onUpdate={loadData} />

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
    </div>
  );
}
