import type { DailyLog, CoachNote, GearEntry, WhoopData } from "./types";

const LOGS_KEY = "tintin_logs";
const NOTES_KEY = "tintin_notes";

function getItem<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Daily Logs

export function getLogs(): DailyLog[] {
  return getItem<DailyLog>(LOGS_KEY);
}

export function getLogByDate(date: string): DailyLog | null {
  return getLogs().find((l) => l.date === date) ?? null;
}

export function getLogsByDateRange(from: string, to: string): DailyLog[] {
  return getLogs()
    .filter((l) => l.date >= from && l.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function upsertLog(payload: {
  date: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  gear_json: GearEntry[];
  whoop_json: WhoopData;
  client_notes: string | null;
}): DailyLog {
  const logs = getLogs();
  const idx = logs.findIndex((l) => l.date === payload.date);

  if (idx >= 0) {
    logs[idx] = { ...logs[idx], ...payload };
    setItem(LOGS_KEY, logs);
    return logs[idx];
  }

  const newLog: DailyLog = {
    id: crypto.randomUUID(),
    user_id: "local-client",
    created_at: new Date().toISOString(),
    ...payload,
  };
  logs.push(newLog);
  setItem(LOGS_KEY, logs);
  return newLog;
}

// Coach Notes

export function getCoachNotes(): CoachNote[] {
  return getItem<CoachNote>(NOTES_KEY);
}

export function getCoachNotesByDate(date: string): CoachNote[] {
  return getCoachNotes()
    .filter((n) => n.date === date)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function addCoachNote(date: string, note: string): CoachNote {
  const notes = getCoachNotes();
  const newNote: CoachNote = {
    id: crypto.randomUUID(),
    client_id: "local-client",
    coach_id: "local-coach",
    date,
    note,
    created_at: new Date().toISOString(),
  };
  notes.push(newNote);
  setItem(NOTES_KEY, notes);
  return newNote;
}

export function deleteCoachNote(id: string) {
  const notes = getCoachNotes().filter((n) => n.id !== id);
  setItem(NOTES_KEY, notes);
}
