"use client";

import { useState } from "react";

const WEEKLY_INJECTIONS = [
  { day: "Sun", items: "Retatrutide 2mg" },
  { day: "Mon", items: "HCG 500iu · Tesamorelin 1mg" },
  { day: "Tue", items: "Tesamorelin 1mg" },
  { day: "Wed", items: "HCG 500iu · Tesamorelin 1mg" },
  { day: "Thu", items: "Tesamorelin 1mg" },
  { day: "Fri", items: "HCG 500iu · Tesamorelin 1mg" },
];

const ORAL_GEAR = [
  "Raloxifene 30mg — 6x/wk (skip Mon)",
  "Arimidex 0.5mg — E2D",
  "Anavar 25–50mg — daily",
  "Cialis 5–10mg — pre-workout",
];

const SUPPLEMENTS = {
  Morning: [
    "Re-Lyte Electrolytes — 1 scoop",
    "Opti-Men Multi — 3 tabs",
    "Vitamin D3 + K2 — 1 cap",
    "Vitamin C — 1000mg",
    "Omega-3 — 3 softgels",
    "Selenium — 100mcg",
    "Mag Glycinate — 600mg (3 caps)",
    "Lion's Mane — 500mg",
    "Minoxidil — 2.5mg",
    "Finasteride — 1mg",
  ],
  Fiber: ["Psyllium Husk — 1 serving (take alone)"],
  "Pre-Workout": [
    "Citrus Bergamot — 1200mg (2 caps)",
    "NAC — 1200mg (2 caps)",
    "L-Carnitine Tartrate — 1000mg (2 caps)",
    "Beet Root — 8000mg",
    "Zinc Picolinate — 50mg (EOD)",
    "CoQ10 — 400mg (2 caps)",
    "TUDCA — 500mg",
  ],
  Night: [
    "Mag Glycinate — 800mg (4 caps)",
    "DIM — 300mg",
    "L-Theanine — 200mg",
    "Ashwagandha — 670mg",
  ],
};

function Section({ title, color, children, defaultOpen = false }: { title: string; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-1.5 text-left active:scale-[0.99] transition-transform"
      >
        <span className={`text-[10px] font-black ${open ? "rotate-90" : ""} transition-transform`}>▶</span>
        <span className={`text-[10px] font-black uppercase tracking-wider ${color}`}>{title}</span>
      </button>
      {open && <div className="pl-4 pb-2">{children}</div>}
    </div>
  );
}

function Row({ text }: { text: string }) {
  return <p className="text-xs font-bold text-muted leading-5">{text}</p>;
}

export default function GearProtocol() {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-1">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-2">Gear & Protocol</h3>

      <Section title="Injections — Weekly SubQ" color="text-cyan">
        {WEEKLY_INJECTIONS.map((r) => (
          <div key={r.day} className="flex gap-2 leading-5">
            <span className="text-xs font-black text-white w-8 flex-shrink-0">{r.day}</span>
            <span className="text-xs font-bold text-muted">{r.items}</span>
          </div>
        ))}
      </Section>

      <Section title="Injections — Cycle IM (E3D)" color="text-cyan">
        <Row text="Testosterone 150mg (0.6ml) + Glutathione 300mg (0.5ml)" />
        <Row text="Anchor: Mon Apr 13 @ 3:00 PM" />
      </Section>

      <Section title="Oral Gear" color="text-pink">
        {ORAL_GEAR.map((item) => (
          <Row key={item} text={item} />
        ))}
      </Section>

      <Section title="Klow — SubQ Mon–Fri" color="text-pink">
        <Row text="Trial (thru May 1): 1.25mg AM + 1.25mg PM" />
        <Row text="After trial: 5mg once daily (0.3ml)" />
      </Section>

      <Section title="Supplements — Morning" color="text-success">
        {SUPPLEMENTS.Morning.map((s) => (
          <Row key={s} text={s} />
        ))}
      </Section>

      <Section title="Fiber" color="text-success">
        {SUPPLEMENTS.Fiber.map((s) => (
          <Row key={s} text={s} />
        ))}
      </Section>

      <Section title="Supplements — Pre-Workout" color="text-warning">
        {SUPPLEMENTS["Pre-Workout"].map((s) => (
          <Row key={s} text={s} />
        ))}
      </Section>

      <Section title="Supplements — Night" color="text-accent">
        {SUPPLEMENTS.Night.map((s) => (
          <Row key={s} text={s} />
        ))}
      </Section>
    </div>
  );
}
