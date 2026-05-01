import { supabase } from "./supabase";
import type { DailyLog, CoachNote, GearEntry, FoodEntry, ExerciseEntry, WhoopData } from "./types";

// Daily Logs

export async function getLogByDate(date: string): Promise<DailyLog | null> {
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("date", date)
    .single();
  return data;
}

export async function getLogsByDateRange(from: string, to: string): Promise<DailyLog[]> {
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });
  return data ?? [];
}

export async function upsertLog(payload: {
  date: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  gear_json: GearEntry[];
  food_json: FoodEntry[];
  exercise_json: ExerciseEntry[];
  whoop_json: WhoopData;
  client_notes: string | null;
}): Promise<DailyLog | null> {
  const { data } = await supabase
    .from("daily_logs")
    .upsert(
      { ...payload, updated_at: new Date().toISOString() },
      { onConflict: "date" }
    )
    .select()
    .single();
  return data;
}

// Coach Notes

export async function getCoachNotesByDate(date: string): Promise<CoachNote[]> {
  const { data } = await supabase
    .from("coach_notes")
    .select("*")
    .eq("date", date)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function addCoachNote(date: string, note: string): Promise<CoachNote | null> {
  const { data } = await supabase
    .from("coach_notes")
    .insert({ date, note })
    .select()
    .single();
  return data;
}

export async function deleteCoachNote(id: string): Promise<void> {
  await supabase.from("coach_notes").delete().eq("id", id);
}

// WHOOP Tokens

export async function getWhoopTokens(): Promise<{ access_token: string; refresh_token: string | null; expires_at: string | null } | null> {
  const { data } = await supabase
    .from("whoop_tokens")
    .select("*")
    .eq("id", 1)
    .single();
  return data;
}

export async function saveWhoopTokens(accessToken: string, refreshToken: string | null, expiresIn: number): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await supabase
    .from("whoop_tokens")
    .upsert({
      id: 1,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
}
