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
  // Detailed breakdown
  resting_heart_rate?: number;
  hrv?: number;
  spo2?: number;
  skin_temp?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  calories_burned?: number;
  sleep_performance?: number;
  sleep_efficiency?: number;
  sleep_consistency?: number;
  respiratory_rate?: number;
  light_sleep?: number;
  deep_sleep?: number;
  rem_sleep?: number;
  awake_time?: number;
  disturbances?: number;
  sleep_cycles?: number;
}

export interface MealMacros {
  meal: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
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
  meals_json: MealMacros[];
  client_notes: string | null;
  created_at: string;
}

export interface CoachNote {
  id: string;
  client_id: string;
  coach_id: string;
  date: string;
  note: string;
  reply: string | null;
  replied_at: string | null;
  read_by_client: boolean;
  read_by_coach: boolean;
  created_at: string;
}
