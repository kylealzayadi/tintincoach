"use client";

import type { DailyLog } from "@/lib/types";

interface MacroCardsProps {
  log: DailyLog | null;
}

function Card({ label, value, unit, color }: { label: string; value: number | null; unit: string; color: string }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <p className="text-muted text-xs font-black uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-black ${color}`}>
        {value ?? "—"}
        {value != null && <span className="text-sm font-bold text-muted ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function MacroCards({ log }: MacroCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card label="Calories" value={log?.calories ?? null} unit="kcal" color="text-white" />
      <Card label="Protein" value={log?.protein ?? null} unit="g" color="text-cyan" />
      <Card label="Carbs" value={log?.carbs ?? null} unit="g" color="text-warning" />
      <Card label="Fats" value={log?.fats ?? null} unit="g" color="text-pink" />
    </div>
  );
}
