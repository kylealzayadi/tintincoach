"use client";

import type { ExerciseEntry } from "@/lib/types";

interface ExerciseListProps {
  exercises: ExerciseEntry[];
}

export default function ExerciseList({ exercises }: ExerciseListProps) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-3">Exercise</h3>
      {!exercises || exercises.length === 0 ? (
        <p className="text-muted text-sm font-bold">No exercise logged</p>
      ) : (
        <div className="space-y-3">
          {exercises.map((entry, i) => (
            <div key={i} className="border-l-2 border-cyan pl-3">
              <p className="text-sm font-black text-white">{entry.exercise}</p>
              <div className="flex gap-3 mt-1 text-xs font-bold text-muted">
                {entry.sets && <span><span className="text-cyan">{entry.sets}</span> sets</span>}
                {entry.reps && <span><span className="text-cyan">{entry.reps}</span> reps</span>}
                {entry.weight && <span><span className="text-cyan">{entry.weight}</span></span>}
              </div>
              {entry.notes && <p className="text-xs font-bold text-muted mt-1">{entry.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
