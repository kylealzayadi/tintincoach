"use client";

import { useState, useEffect } from "react";

export const GEAR_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAYS = GEAR_DAYS;

interface DaySchedule {
  injections: { name: string; dose: string; vol: string }[];
  oral: { name: string; dose: string }[];
}

export const GEAR_SCHEDULE: Record<string, DaySchedule> = {
  Sun: {
    injections: [{ name: "Retatrutide", dose: "1mg", vol: "0.1ml" }],
    oral: [{ name: "Raloxifene", dose: "30mg" }],
  },
  Mon: {
    injections: [
      { name: "HCG", dose: "500iu", vol: "0.2ml" },
      { name: "Tesamorelin", dose: "1mg", vol: "0.2ml" },
      { name: "Klow", dose: "5mg", vol: "0.3ml" },
    ],
    oral: [],
  },
  Tue: {
    injections: [
      { name: "Tesamorelin", dose: "1mg", vol: "0.2ml" },
      { name: "Klow", dose: "5mg", vol: "0.3ml" },
    ],
    oral: [{ name: "Raloxifene", dose: "30mg" }],
  },
  Wed: {
    injections: [
      { name: "Retatrutide", dose: "1mg", vol: "0.1ml" },
      { name: "HCG", dose: "500iu", vol: "0.2ml" },
      { name: "Tesamorelin", dose: "1mg", vol: "0.2ml" },
      { name: "Klow", dose: "5mg", vol: "0.3ml" },
    ],
    oral: [{ name: "Raloxifene", dose: "30mg" }],
  },
  Thu: {
    injections: [
      { name: "Tesamorelin", dose: "1mg", vol: "0.2ml" },
      { name: "Klow", dose: "5mg", vol: "0.3ml" },
    ],
    oral: [{ name: "Raloxifene", dose: "30mg" }],
  },
  Fri: {
    injections: [
      { name: "HCG", dose: "500iu", vol: "0.2ml" },
      { name: "Tesamorelin", dose: "1mg", vol: "0.2ml" },
      { name: "Klow", dose: "5mg", vol: "0.3ml" },
    ],
    oral: [{ name: "Raloxifene", dose: "30mg" }],
  },
  Sat: {
    injections: [],
    oral: [{ name: "Raloxifene", dose: "30mg" }],
  },
};

const CYCLE_IM = [
  { name: "Testosterone", dose: "150mg", vol: "0.6ml" },
  { name: "Glutathione", dose: "300mg", vol: "0.5ml" },
];
const CYCLE_ORAL = [{ name: "Arimidex", dose: "0.5mg" }];

const CYCLE_START = new Date("2026-04-30T00:00:00");

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

function isTestDay(d: Date): boolean {
  const diff = daysBetween(CYCLE_START, d);
  return diff >= 0 && diff % 3 === 0;
}

function isArimidexDay(d: Date): boolean {
  const diff = daysBetween(CYCLE_START, d);
  return diff >= 1 && (diff - 1) % 3 === 0;
}

const SUPPLEMENTS = {
  Morning: [
    "Electrolytes (Re-Lyte) — 1 scoop",
    "Opti-Men Multivitamin — 3 tablets",
    "Vitamin D3 + K2 — 125mcg D3 / 100mcg K2 (1 capsule)",
    "Vitamin C — 1000mg (1 tablet)",
    "Omega-3 — 2500mg (3 softgels)",
    "Selenium — 100mcg (1 capsule)",
    "Magnesium Glycinate — 600mg (3 capsules)",
    "Lion's Mane — 500mg (1 capsule)",
    "Minoxidil — 2.5mg (1 tablet)",
    "Finasteride — 1mg (1 tablet)",
  ],
  "Fiber (take alone)": [
    "Psyllium Husk Fiber — 1 serving",
  ],
  "Afternoon / Pre-Workout": [
    "Citrus Bergamot — 1200mg (2 capsules)",
    "NAC — 1200mg (2 capsules)",
    "L-Carnitine Tartrate — 1000mg (2 capsules)",
    "Beet Root — 8000mg (1 capsule)",
    "Zinc Picolinate — 50mg (1 capsule) — EOD",
    "CoQ10 — 400mg (2 capsules)",
    "TUDCA — 500mg (1 capsule)",
  ],
  Night: [
    "Magnesium Glycinate — 800mg (4 capsules)",
    "DIM — 300mg (1 capsule)",
    "L-Theanine — 200mg (1 capsule)",
    "Ashwagandha — 670mg mixed extract (1 capsule)",
  ],
};

const suppColors: Record<string, string> = {
  Morning: "text-success",
  "Fiber (take alone)": "text-warning",
  "Afternoon / Pre-Workout": "text-cyan",
  Night: "text-accent",
};

const suppDots: Record<string, string> = {
  Morning: "bg-success",
  "Fiber (take alone)": "bg-warning",
  "Afternoon / Pre-Workout": "bg-cyan",
  Night: "bg-accent",
};

function Row({ dot, name, detail }: { dot: string; name: string; detail: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-xs font-bold text-white flex-1">{name}</span>
      <span className="text-xs font-bold text-muted">{detail}</span>
    </div>
  );
}

export default function GearProtocol({ embedded = false, date }: { embedded?: boolean; date?: Date }) {
  const selectedDay = DAYS[(date ?? new Date()).getDay()];
  const today = DAYS[new Date().getDay()];
  const [activeDay, setActiveDay] = useState<string>(selectedDay);
  const [showSupps, setShowSupps] = useState(false);

  useEffect(() => { setActiveDay(selectedDay); }, [selectedDay]);

  const sched = GEAR_SCHEDULE[activeDay];

  const baseDate = date ?? new Date();
  const baseDayIndex = DAYS.indexOf(selectedDay);
  const activeDayIndex = DAYS.indexOf(activeDay as typeof DAYS[number]);
  const dayOffset = ((activeDayIndex - baseDayIndex) + 7) % 7;
  const activeDate = new Date(baseDate);
  activeDate.setDate(activeDate.getDate() + dayOffset);

  const showTestDay = isTestDay(activeDate);
  const showArimidexDay = isArimidexDay(activeDate);

  const totalSupps = Object.values(SUPPLEMENTS).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className={embedded ? "space-y-3" : "bg-card border-2 border-border rounded-2xl p-4 space-y-3"}>
      {!embedded && <h3 className="text-xs font-black text-muted uppercase tracking-wider">Gear & Protocol</h3>}

      {/* Day selector bar */}
      <div className="flex gap-1">
        {DAYS.map((day, i) => {
          const isActive = activeDay === day;
          const isToday = today === day;
          const offset = ((i - baseDayIndex) + 7) % 7;
          const dayDate = new Date(baseDate);
          dayDate.setDate(dayDate.getDate() + offset);
          const dateNum = dayDate.getDate();
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 relative flex flex-col items-center ${
                isActive
                  ? "bg-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]"
                  : "bg-background border border-border text-muted hover:text-white"
              }`}
            >
              {day}
              <span className={`text-[9px] font-bold ${isActive ? "text-white/70" : "text-muted/50"}`}>{dateNum}</span>
              {isToday && !isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-success rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day's schedule */}
      <div className="space-y-2">
        {sched.injections.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan mb-1">Injections (SubQ)</p>
            {sched.injections.map((item) => (
              <Row key={item.name} dot="bg-cyan" name={item.name} detail={`${item.dose} · ${item.vol}`} />
            ))}
          </div>
        )}

        {sched.oral.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-pink mb-1">Oral</p>
            {sched.oral.map((item) => (
              <Row key={item.name} dot="bg-pink" name={item.name} detail={item.dose} />
            ))}
          </div>
        )}

        {sched.injections.length === 0 && (
          <p className="text-xs font-bold text-muted/50">No injections this day</p>
        )}
      </div>

      {/* Cycle-Based */}
      <div className="border-t border-border pt-2 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted">Cycle-Based</p>
        {showTestDay ? (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan mb-1">IM — Today</p>
            {CYCLE_IM.map((item) => (
              <Row key={item.name} dot="bg-cyan" name={item.name} detail={`${item.dose} · ${item.vol}`} />
            ))}
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted/50 mb-1">IM — Off Day</p>
            <p className="text-xs font-bold text-muted/40">Test + Gluta every 72hrs</p>
          </div>
        )}
        {showArimidexDay ? (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-pink mb-1">Oral — Today</p>
            {CYCLE_ORAL.map((item) => (
              <Row key={item.name} dot="bg-pink" name={item.name} detail={item.dose} />
            ))}
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted/50 mb-1">Arimidex — Off Day</p>
            <p className="text-xs font-bold text-muted/40">Day after Test</p>
          </div>
        )}
      </div>

      {/* Supplements toggle */}
      <div className="border-t border-border pt-2">
        <button
          type="button"
          onClick={() => setShowSupps(!showSupps)}
          className="w-full flex items-center gap-2 py-1 text-left active:scale-[0.99] transition-transform"
        >
          <span className={`text-[10px] font-black transition-transform ${showSupps ? "rotate-90" : ""}`}>▶</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-success">Daily Supplements</span>
          <span className="text-[10px] font-bold text-muted ml-auto">{totalSupps} items</span>
        </button>

        {showSupps && (
          <div className="pt-2 space-y-3">
            {(Object.entries(SUPPLEMENTS) as [string, string[]][]).map(([section, items]) => (
              <div key={section}>
                <p className={`text-[10px] font-black uppercase tracking-wider ${suppColors[section] ?? "text-muted"} mb-1`}>{section}</p>
                {items.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${suppDots[section] ?? "bg-muted"}`} />
                    <span className="text-xs font-bold text-muted">{s}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
