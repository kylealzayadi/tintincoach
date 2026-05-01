"use client";

import type { FoodEntry } from "@/lib/types";

interface FoodListProps {
  food: FoodEntry[];
}

export default function FoodList({ food }: FoodListProps) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-3">Food Log</h3>
      {!food || food.length === 0 ? (
        <p className="text-muted text-sm font-bold">No food logged</p>
      ) : (
        <div className="space-y-3">
          {food.map((entry, i) => (
            <div key={i} className="border-l-2 border-warning pl-3">
              <p className="text-xs font-black text-warning uppercase tracking-wider">{entry.meal}</p>
              <p className="text-sm font-bold text-white mt-0.5">{entry.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
