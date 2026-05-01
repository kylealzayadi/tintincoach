"use client";

import { useState, useRef, useEffect } from "react";
import type { DailyLog } from "@/lib/types";

interface MacroCardsProps {
  log: DailyLog | null;
  selectedMeal?: string | null;
  clientNotes?: string | null;
}

function Card({ label, value, unit, color, sub }: { label: string; value: number | null; unit: string; color: string; sub?: string }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-muted text-xs font-black uppercase tracking-wider mb-1">{label}</p>
        {sub && <p className="text-[9px] font-bold text-accent uppercase">{sub}</p>}
      </div>
      <p className={`text-3xl font-black ${color}`}>
        {value ?? "—"}
        {value != null && <span className="text-sm font-bold text-muted ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function MacroCards({ log, selectedMeal, clientNotes }: MacroCardsProps) {
  const meal = selectedMeal ? log?.meals_json?.find((m) => m.meal === selectedMeal) : null;
  const showMeal = selectedMeal && meal;

  const calories = showMeal ? meal!.calories : log?.calories ?? null;
  const protein = showMeal ? meal!.protein : log?.protein ?? null;
  const carbs = showMeal ? meal!.carbs : log?.carbs ?? null;
  const fats = showMeal ? meal!.fats : log?.fats ?? null;
  const mealLabel = showMeal ? selectedMeal! : undefined;

  const hasMeals = !selectedMeal && log?.meals_json && log.meals_json.length > 0;
  const [checkInOpen, setCheckInOpen] = useState(false);
  const checkInTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (checkInTimer.current) clearTimeout(checkInTimer.current); };
  }, []);

  function toggleCheckIn() {
    if (checkInTimer.current) clearTimeout(checkInTimer.current);
    const next = !checkInOpen;
    setCheckInOpen(next);
    if (next) {
      checkInTimer.current = setTimeout(() => setCheckInOpen(false), 3000);
    }
  }

  const checkIn = clientNotes ? (() => {
    const metaMatch = clientNotes.match(/^\[(.*?)\s*•\s*(.*?)\]\n?([\s\S]*)$/);
    if (metaMatch) return { meal: metaMatch[1], time: metaMatch[2], body: metaMatch[3] };
    return { meal: null, time: null, body: clientNotes };
  })() : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card label="Calories" value={calories} unit="kcal" color="text-white" sub={mealLabel} />
        <Card label="Protein" value={protein} unit="g" color="text-cyan" sub={mealLabel} />
        <Card label="Carbs" value={carbs} unit="g" color="text-warning" sub={mealLabel} />
        <Card label="Fats" value={fats} unit="g" color="text-pink" sub={mealLabel} />
      </div>

      {!selectedMeal && (hasMeals || checkIn) && (
        <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-1">
          <p className="text-muted text-xs font-black uppercase tracking-wider mb-2">By Meal</p>
          {hasMeals && log!.meals_json.map((m) => (
            <div key={m.meal} className="py-1.5 border-b border-border last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white uppercase tracking-wider">{m.meal}</span>
                  {checkIn && checkIn.meal === m.meal && (
                    <button
                      onClick={toggleCheckIn}
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full transition-all active:scale-95 ${
                        checkInOpen
                          ? "bg-success text-white"
                          : "bg-success/20 text-success animate-pulse"
                      }`}
                    >
                      +1
                    </button>
                  )}
                </div>
                <span className="text-xs font-bold text-muted">
                  <span className="text-white">{m.calories ?? 0}</span>
                  <span className="text-white/40"> cal</span>
                  {" · "}
                  <span className="text-cyan">{m.protein ?? 0}</span>
                  <span className="text-cyan/60">p</span>
                  {" · "}
                  <span className="text-warning">{m.carbs ?? 0}</span>
                  <span className="text-warning/60">c</span>
                  {" · "}
                  <span className="text-pink">{m.fats ?? 0}</span>
                  <span className="text-pink/60">f</span>
                </span>
              </div>
              {m.description && (
                <p className="text-[11px] font-bold text-muted/70 mt-0.5">{m.description}</p>
              )}
              {checkIn && checkIn.meal === m.meal && checkInOpen && (
                <div className="mt-2 border-t border-border pt-2">
                  <p className="text-[10px] font-black text-success uppercase tracking-wider">Check In Update</p>
                  <p className="text-[10px] font-bold text-muted mt-0.5">{checkIn.time}</p>
                  <p className="text-xs font-bold text-white whitespace-pre-wrap mt-1">{checkIn.body}</p>
                </div>
              )}
            </div>
          ))}
          {checkIn && (!hasMeals || !log!.meals_json.some((m) => m.meal === checkIn.meal)) && (
            <div className="py-1.5">
              <button
                onClick={toggleCheckIn}
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-full transition-all active:scale-95 mb-1 ${
                  checkInOpen
                    ? "bg-success text-white"
                    : "bg-success/20 text-success animate-pulse"
                }`}
              >
                +1 Check In
              </button>
              {checkInOpen && (
                <div>
                  <p className="text-[10px] font-black text-success uppercase tracking-wider">Check In Update</p>
                  <p className="text-[10px] font-bold text-muted mt-0.5">{checkIn.time}</p>
                  <p className="text-xs font-bold text-white whitespace-pre-wrap mt-1">{checkIn.body}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
