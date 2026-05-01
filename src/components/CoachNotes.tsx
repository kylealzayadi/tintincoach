"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { CoachNote, UserRole } from "@/lib/types";
import { replyToNote } from "@/lib/store";

interface CoachNotesProps {
  notes: CoachNote[];
  role: UserRole;
  onUpdate?: () => void;
}

export default function CoachNotes({ notes, role, onUpdate }: CoachNotesProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleReply(noteId: string) {
    if (!replyText.trim()) return;
    setSending(true);
    await replyToNote(noteId, replyText.trim());
    setReplyText("");
    setReplyingTo(null);
    setSending(false);
    if (onUpdate) onUpdate();
  }

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <h3 className="text-xs font-black text-muted uppercase tracking-wider mb-3">Coach Notes</h3>
      {notes.length === 0 ? (
        <p className="text-muted text-sm font-bold">No coach notes for this day</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="space-y-2">
              {/* Coach's note */}
              <div className="border-l-2 border-accent pl-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-accent uppercase tracking-wider">Coach</span>
                  {role === "client" && !note.read_by_client && (
                    <span className="bg-danger text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">New</span>
                  )}
                </div>
                <p className="text-sm font-bold whitespace-pre-wrap text-white">{note.note}</p>
                <p className="text-xs font-bold text-muted mt-1">
                  {format(new Date(note.created_at), "MMM d, h:mm a")}
                </p>
              </div>

              {/* Reply (if exists) */}
              {note.reply && (
                <div className="border-l-2 border-success pl-3 ml-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black text-success uppercase tracking-wider">Client Reply</span>
                    {role === "coach" && !note.read_by_coach && (
                      <span className="bg-danger text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">New</span>
                    )}
                  </div>
                  <p className="text-sm font-bold whitespace-pre-wrap text-white">{note.reply}</p>
                  {note.replied_at && (
                    <p className="text-xs font-bold text-muted mt-1">
                      {format(new Date(note.replied_at), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>
              )}

              {/* Reply button/form (client only, no existing reply) */}
              {role === "client" && !note.reply && (
                <div className="ml-4">
                  {replyingTo === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        placeholder="Type your reply..."
                        autoFocus
                        className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-success focus:shadow-[0_0_15px_#00e67640] transition-all resize-none placeholder:text-muted/50"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(note.id)}
                          disabled={!replyText.trim() || sending}
                          className="bg-success/20 hover:bg-success/30 text-success rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider transition disabled:opacity-50 active:scale-95"
                        >
                          {sending ? "Sending..." : "Send"}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          className="text-xs font-bold text-muted hover:text-white transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(note.id)}
                      className="text-xs font-black text-accent hover:text-accent-hover transition active:scale-95"
                    >
                      Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
