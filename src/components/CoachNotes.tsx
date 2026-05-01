"use client";

import { format } from "date-fns";
import type { CoachNote } from "@/lib/types";

interface CoachNotesProps {
  notes: CoachNote[];
}

export default function CoachNotes({ notes }: CoachNotesProps) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-3">Coach Notes</h3>
      {notes.length === 0 ? (
        <p className="text-muted text-sm font-bold">No coach notes for this day</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="border-l-2 border-accent pl-3">
              <p className="text-sm font-bold whitespace-pre-wrap text-white">{note.note}</p>
              <p className="text-xs font-bold text-muted mt-1">
                {format(new Date(note.created_at), "MMM d, h:mm a")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
