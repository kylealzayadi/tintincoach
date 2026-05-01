"use client";

import type { GearEntry } from "@/lib/types";

interface GearListProps {
  gear: GearEntry[];
}

export default function GearList({ gear }: GearListProps) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-3">Gear</h3>
      {!gear || gear.length === 0 ? (
        <p className="text-muted text-sm font-bold">No gear logged</p>
      ) : (
        <div className="space-y-2">
          {gear.map((entry, i) => (
            <div key={i} className="flex justify-between text-sm font-bold">
              <span className="text-white">{entry.compound}</span>
              <span className="text-accent">{entry.dose}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
