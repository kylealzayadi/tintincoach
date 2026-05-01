"use client";

import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface DaySchedule {
  injections: string[];
  oral: string[];
  klow: string | null;
}

const SCHEDULE: Record<string, DaySchedule> = {
  Sun: {
    injections: ["Retatrutide 2mg (SubQ)"],
    oral: ["Raloxifene 30mg", "Anavar 25–50mg", "Cialis 5–10mg (pre-workout)"],
    klow: null,
  },
  Mon: {
    injections: ["HCG 500iu (SubQ)", "Tesamorelin 1mg (SubQ)"],
    oral: ["Anavar 25–50mg", "Cialis 5–10mg (pre-workout)"],
    klow: "1.25mg AM + 1.25mg PM",
  },
  Tue: {
    injections: ["Tesamorelin 1mg (SubQ)"],
    oral: ["Raloxifene 30mg", "Anavar 25–50mg", "Cialis 5–10mg (pre-workout)"],
    klow: "1.25mg AM + 1.25mg PM",
  },
  Wed: {
    injections: ["HCG 500iu (SubQ)", "Tesamorelin 1mg (SubQ)"],
    oral: ["Raloxifene 30mg", "Anavar 25–50mg", "Cialis 5–10mg (pre-workout)"],
    klow: "1.25mg AM + 1.25mg PM",
  },
  Thu: {
    injections: ["Tesamorelin 1mg (SubQ)"],
    oral: ["Raloxifene 30mg", "Anavar 25–50mg", "Cialis 5–10mg (pre-workout)"],
    klow: "1.25mg AM + 1.25mg PM",
  },
  Fri: {
    injections: ["HCG 500iu (SubQ)", "Tesamorelin 1mg (SubQ)"],
    oral: ["Raloxifene 30mg", "Anavar 25–50mg", "Cialis 5–10mg (pre-workout)"],
    klow: "1.25mg AM + 1.25mg PM",
  },
  Sat: {
    injections: [],
    oral: ["Raloxifene 30mg", "Anavar 25–50mg", "Cialis 5–10mg (pre-workout)"],
    klow: null,
  },
};

const CYCLE_BASED = [
  { name: "Testosterone 150mg + Glutathione 300mg", route: "IM", freq: "E3D", anchor: "Mon Apr 13 @ 3 PM" },
  { name: "Arimidex 0.5mg", route: "Oral", freq: "E2D", anchor: "Sat Apr 25 @ 8 AM" },
];

const SUPPLEMENTS = {
  Morning: [
    "Re-Lyte Electrolytes — 1 scoop",
    "Opti-Men Multi — 3 tabs",
    "D3 + K2 — 1 cap",
    "Vitamin C — 1000mg",
    "Omega-3 — 3 softgels",
    "Selenium — 100mcg",
    "Mag Glycinate — 600mg",
    "Lion's Mane — 500mg",
    "Minoxidil — 2.5mg",
    "Finasteride — 1mg",
  ],
  Fiber: ["Psyllium Husk — 1 serving"],
  "Pre-Workout": [
    "Citrus Bergamot — 1200mg",
    "NAC — 1200mg",
    "L-Carnitine — 1000mg",
    "Beet Root — 8000mg",
    "Zinc Picolinate — 50mg (EOD)",
    "CoQ10 — 400mg",
    "TUDCA — 500mg",
  ],
  Night: [
    "Mag Glycinate — 800mg",
    "DIM — 300mg",
    "L-Theanine — 200mg",
    "Ashwagandha — 670mg",
  ],
};

function Label({ text, color }: { text: string; color: string }) {
  return <p className={`text-[10px] font-black uppercase tracking-wider ${color} mb-1 mt-2 first:mt-0`}>{text}</p>;
}

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-block bg-background border border-border rounded-lg px-2 py-1 text-[11px] font-bold text-white mr-1.5 mb-1.5">
      {text}
    </span>
  );
}

function SupRow({ text }: { text: string }) {
  return <p className="text-[11px] font-bold text-muted leading-5">{text}</p>;
}

export default function GearProtocol() {
  const today = DAYS[new Date().getDay()];
  const [activeDay, setActiveDay] = useState<string>(today);
  const [showSupps, setShowSupps] = useState(false);

  const sched = SCHEDULE[activeDay];

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-3">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider">Gear & Protocol</h3>

      {/* Day selector bar */}
      <div className="flex gap-1">
        {DAYS.map((day) => {
          const isActive = activeDay === day;
          const isToday = today === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 relative ${
                isActive
                  ? "bg-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]"
                  : "bg-background border border-border text-muted hover:text-white"
              }`}
            >
              {day}
              {isToday && !isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-success rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day's schedule */}
      <div className="space-y-1">
        {sched.injections.length > 0 && (
          <div>
            <Label text="Injections" color="text-cyan" />
            <div className="flex flex-wrap">
              {sched.injections.map((item) => <Pill key={item} text={item} />)}
            </div>
          </div>
        )}

        {sched.oral.length > 0 && (
          <div>
            <Label text="Oral" color="text-pink" />
            <div className="flex flex-wrap">
              {sched.oral.map((item) => <Pill key={item} text={item} />)}
            </div>
          </div>
        )}

        {sched.klow && (
          <div>
            <Label text="Klow (SubQ)" color="text-warning" />
            <div className="flex flex-wrap">
              <Pill text={sched.klow} />
            </div>
          </div>
        )}

        {sched.injections.length === 0 && !sched.klow && (
          <p className="text-xs font-bold text-muted/50 mt-1">No injections this day</p>
        )}
      </div>

      {/* Cycle-based */}
      <div className="border-t border-border pt-2">
        <Label text="Cycle-Based (rotating)" color="text-cyan" />
        {CYCLE_BASED.map((c) => (
          <div key={c.name} className="flex flex-wrap items-baseline gap-x-2 mb-1">
            <span className="text-[11px] font-bold text-white">{c.name}</span>
            <span className="text-[10px] font-bold text-muted">{c.route} · {c.freq} · from {c.anchor}</span>
          </div>
        ))}
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
          <span className="text-[10px] font-bold text-muted ml-auto">{
            SUPPLEMENTS.Morning.length + SUPPLEMENTS.Fiber.length + SUPPLEMENTS["Pre-Workout"].length + SUPPLEMENTS.Night.length
          } items</span>
        </button>

        {showSupps && (
          <div className="pl-4 pt-1 space-y-2">
            <div>
              <Label text="Morning" color="text-success" />
              {SUPPLEMENTS.Morning.map((s) => <SupRow key={s} text={s} />)}
            </div>
            <div>
              <Label text="Fiber (take alone)" color="text-success" />
              {SUPPLEMENTS.Fiber.map((s) => <SupRow key={s} text={s} />)}
            </div>
            <div>
              <Label text="Pre-Workout" color="text-warning" />
              {SUPPLEMENTS["Pre-Workout"].map((s) => <SupRow key={s} text={s} />)}
            </div>
            <div>
              <Label text="Night" color="text-accent" />
              {SUPPLEMENTS.Night.map((s) => <SupRow key={s} text={s} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
