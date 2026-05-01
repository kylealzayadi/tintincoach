"use client";

import type { GearEntry } from "@/lib/types";

interface GearListProps {
  gear: GearEntry[];
}

export default function GearList({ gear }: GearListProps) {
  if (!gear || gear.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-muted mb-2">Gear</h3>
        <p className="text-muted text-sm">No gear logged</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-muted mb-3">Gear</h3>
      <div className="space-y-1.5">
        {gear.map((entry, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{entry.compound}</span>
            <span className="text-muted">{entry.dose}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
