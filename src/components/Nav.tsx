"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { getAllUnreadNotes, getAllUnreadReplies, markNotesReadByClient, markRepliesReadByCoach } from "@/lib/store";
import type { UserRole, CoachNote } from "@/lib/types";

interface NavProps {
  role: UserRole;
  unreadCount?: number;
}

export default function Nav({ role, unreadCount = 0 }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const links =
    role === "coach"
      ? []
      : [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/log", label: "Log" },
        ];

  function handleSignOut() {
    logout();
    router.push("/login");
  }

  async function loadNotes() {
    const data = role === "client" ? await getAllUnreadNotes() : await getAllUnreadReplies();
    setNotes(data);
    setLoaded(true);
  }

  function toggleDropdown() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) loadNotes();
    if (next) loadNotes();
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <nav className="border-b-2 border-border bg-card sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href={role === "coach" ? "/coach" : "/dashboard"} className="font-black text-xs sm:text-sm mr-1 sm:mr-3 whitespace-nowrap">
            <span className="text-white">PROJECT </span><span className="text-accent">WAR</span>
            <span className="text-muted text-[9px] sm:text-[10px] ml-1">by TinTin</span>
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                pathname === link.href
                  ? "bg-accent text-white shadow-[0_0_15px_var(--color-accent-glow)]"
                  : "text-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notes icon with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="relative p-1.5 text-muted hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[9px] font-black rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-card border-2 border-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[10px] font-black text-muted uppercase tracking-wider">
                    {role === "client" ? "Coach Notes" : "Client Replies"}
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="px-3 py-4 text-xs font-bold text-muted text-center">
                      {unreadCount > 0 ? "Loading..." : "No unread notes"}
                    </p>
                  ) : (
                    notes.map((note) => (
                      <button
                        key={note.id}
                        onClick={async () => {
                          if (role === "client") {
                            await markNotesReadByClient([note.id]);
                          } else {
                            await markRepliesReadByCoach([note.id]);
                          }
                          setNotes((prev) => prev.filter((n) => n.id !== note.id));
                          setOpen(false);
                          const target = role === "coach" ? "/coach" : "/dashboard";
                          if (pathname !== target) router.push(target);
                        }}
                        className="w-full text-left px-3 py-2.5 border-b border-border last:border-0 hover:bg-background transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-accent uppercase tracking-wider">
                            {format(new Date(note.date), "MMM d, yyyy")}
                          </span>
                          <span className="bg-danger text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                            New
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white line-clamp-2">{note.note}</p>
                        {note.reply && (
                          <div className="mt-1 pl-2 border-l-2 border-success">
                            <p className="text-[11px] font-bold text-muted line-clamp-1">{note.reply}</p>
                            {note.replied_at && (
                              <p className="text-[9px] font-bold text-muted/60 mt-0.5">
                                {format(new Date(note.replied_at), "MMM d, h:mm a")}
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="bg-accent hover:bg-accent-hover text-white rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black uppercase tracking-wider transition-all hover:shadow-[0_0_20px_var(--color-accent-glow)] active:scale-95"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
