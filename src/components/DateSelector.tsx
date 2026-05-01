"use client";

import { format, addDays, subDays, isToday } from "date-fns";

interface DateSelectorProps {
  date: Date;
  onChange: (date: Date) => void;
}

export default function DateSelector({ date, onChange }: DateSelectorProps) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl px-3 py-2 flex items-center justify-between">
      <button
        onClick={() => onChange(subDays(date, 1))}
        className="w-9 h-9 rounded-xl hover:bg-background text-lg font-black transition-all active:scale-90 text-muted hover:text-white"
      >
        ‹
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const input = document.createElement("input");
            input.type = "date";
            input.value = format(date, "yyyy-MM-dd");
            input.onchange = (e) => {
              const val = (e.target as HTMLInputElement).value;
              if (val) onChange(new Date(val + "T12:00:00"));
            };
            input.showPicker();
          }}
          className="text-sm font-black text-white hover:text-accent transition"
        >
          {format(date, "MMM d, yyyy")}
        </button>
        {isToday(date) && (
          <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
            Today
          </span>
        )}
        {!isToday(date) && (
          <button
            onClick={() => onChange(new Date())}
            className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-black uppercase tracking-wider hover:bg-accent/30 transition active:scale-95"
          >
            Today
          </button>
        )}
      </div>
      <button
        onClick={() => onChange(addDays(date, 1))}
        className="w-9 h-9 rounded-xl hover:bg-background text-lg font-black transition-all active:scale-90 text-muted hover:text-white"
      >
        ›
      </button>
    </div>
  );
}
