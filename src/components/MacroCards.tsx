"use client";

import type { DailyLog } from "@/lib/types";

interface MacroCardsProps {
  log: DailyLog | null;
}

function Card({ label, value, unit, color }: { label: string; value: number | null; unit: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-muted text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>
        {value ?? "—"}
        {value != null && <span className="text-sm text-muted ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function MacroCards({ log }: MacroCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card label="Calories" value={log?.calories ?? null} unit="kcal" color="text-foreground" />
      <Card label="Protein" value={log?.protein ?? null} unit="g" color="text-accent" />
      <Card label="Carbs" value={log?.carbs ?? null} unit="g" color="text-warning" />
      <Card label="Fats" value={log?.fats ?? null} unit="g" color="text-danger" />
    </div>
  );
}
