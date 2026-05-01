export type UserRole = "client" | "coach";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  last_viewed_at: string | null;
  created_at: string;
}

export interface GearEntry {
  compound: string;
  dose: string;
}

export interface FoodEntry {
  meal: string;
  description: string;
}

export interface ExerciseEntry {
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
}

export interface WhoopData {
  recovery?: number;
  strain?: number;
  sleep?: number;
}

export interface DailyLog {
  id: string;
  user_id: string;
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
  created_at: string;
}

export interface CoachNote {
  id: string;
  client_id: string;
  coach_id: string;
  date: string;
  note: string;
  created_at: string;
}
