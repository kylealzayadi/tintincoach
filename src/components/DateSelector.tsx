"use client";

import { format, addDays, subDays, isToday } from "date-fns";

interface DateSelectorProps {
  date: Date;
  onChange: (date: Date) => void;
}

export default function DateSelector({ date, onChange }: DateSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(subDays(date, 1))}
        className="w-10 h-10 rounded-xl bg-card border-2 border-border hover:border-accent text-lg font-black transition-all active:scale-95"
      >
        &larr;
      </button>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={format(date, "yyyy-MM-dd")}
          onChange={(e) => onChange(new Date(e.target.value + "T12:00:00"))}
          className="bg-card border-2 border-border rounded-xl px-3 py-2 text-sm font-bold focus:border-accent focus:outline-none transition-all"
        />
        {isToday(date) && (
          <span className="text-xs bg-success/20 text-success px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
            Today
          </span>
        )}
      </div>
      <button
        onClick={() => onChange(addDays(date, 1))}
        className="w-10 h-10 rounded-xl bg-card border-2 border-border hover:border-accent text-lg font-black transition-all active:scale-95"
      >
        &rarr;
      </button>
      {!isToday(date) && (
        <button
          onClick={() => onChange(new Date())}
          className="text-xs font-bold text-accent hover:text-accent-hover transition"
        >
          Today
        </button>
      )}
    </div>
  );
}
