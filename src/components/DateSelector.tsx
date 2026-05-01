"use client";

import { format, addDays, subDays, isToday } from "date-fns";

interface DateSelectorProps {
  date: Date;
  onChange: (date: Date) => void;
}

export default function DateSelector({ date, onChange }: DateSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(subDays(date, 1))}
        className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-border transition text-sm"
      >
        &larr;
      </button>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={format(date, "yyyy-MM-dd")}
          onChange={(e) => onChange(new Date(e.target.value + "T12:00:00"))}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm"
        />
        {isToday(date) && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
            Today
          </span>
        )}
      </div>
      <button
        onClick={() => onChange(addDays(date, 1))}
        className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-border transition text-sm"
      >
        &rarr;
      </button>
      {!isToday(date) && (
        <button
          onClick={() => onChange(new Date())}
          className="text-xs text-muted hover:text-foreground transition"
        >
          Today
        </button>
      )}
    </div>
  );
}
