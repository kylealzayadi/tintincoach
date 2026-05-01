"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, upsertLog } from "@/lib/store";
import type { MealMacros } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";

const inputClass = "w-full bg-background border-2 border-border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-accent focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all placeholder:text-muted/50";

const MEALS = ["Breakfast", "AM Snack", "Lunch", "PM Snack", "Dinner"] as const;

type MealFields = { description: string; calories: string; protein: string; carbs: string; fats: string };
const emptyMeal: MealFields = { description: "", calories: "", protein: "", carbs: "", fats: "" };

export default function LogPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState<Record<string, MealFields>>({});
  const [activeMeal, setActiveMeal] = useState<string>(MEALS[0]);
  const [clientNotes, setClientNotes] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.role === "coach") { router.replace("/coach"); }
    window.scrollTo(0, 0);
  }, [auth, router]);

  useEffect(() => {
    loadDay();
    setSaved(false);
  }, [date]);

  async function loadDay() {
    const dateStr = format(date, "yyyy-MM-dd");
    const log = await getLogByDate(dateStr);

    if (log) {
      setIsUpdate(true);
      setClientNotes(log.client_notes ?? "");

      const loaded: Record<string, MealFields> = {};
      if (log.meals_json && log.meals_json.length > 0) {
        for (const m of log.meals_json) {
          loaded[m.meal] = {
            description: m.description ?? "",
            calories: m.calories?.toString() ?? "",
            protein: m.protein?.toString() ?? "",
            carbs: m.carbs?.toString() ?? "",
            fats: m.fats?.toString() ?? "",
          };
        }
      } else if (log.calories || log.protein || log.carbs || log.fats) {
        loaded["Breakfast"] = {
          description: "",
          calories: log.calories?.toString() ?? "",
          protein: log.protein?.toString() ?? "",
          carbs: log.carbs?.toString() ?? "",
          fats: log.fats?.toString() ?? "",
        };
      }
      setMeals(loaded);
    } else {
      setIsUpdate(false);
      setMeals({});
      setClientNotes("");
    }
  }

  function getMeal(name: string): MealFields {
    return meals[name] ?? emptyMeal;
  }

  function updateMealField(meal: string, field: keyof MealFields, value: string) {
    setMeals((prev) => ({
      ...prev,
      [meal]: { ...(prev[meal] ?? emptyMeal), [field]: value },
    }));
  }

  function mealHasData(name: string): boolean {
    const m = meals[name];
    if (!m) return false;
    return !!(m.calories || m.protein || m.carbs || m.fats || m.description.trim());
  }

  const totals = MEALS.reduce(
    (acc, meal) => {
      const m = meals[meal];
      if (!m) return acc;
      return {
        calories: acc.calories + (m.calories ? Number(m.calories) : 0),
        protein: acc.protein + (m.protein ? Number(m.protein) : 0),
        carbs: acc.carbs + (m.carbs ? Number(m.carbs) : 0),
        fats: acc.fats + (m.fats ? Number(m.fats) : 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const hasMealData = MEALS.some(mealHasData);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const mealsJson: MealMacros[] = MEALS
      .filter(mealHasData)
      .map((meal) => {
        const m = meals[meal]!;
        return {
          meal,
          description: m.description.trim(),
          calories: m.calories ? Number(m.calories) : null,
          protein: m.protein ? Number(m.protein) : null,
          carbs: m.carbs ? Number(m.carbs) : null,
          fats: m.fats ? Number(m.fats) : null,
        };
      });

    const foodJson = mealsJson
      .filter((m) => m.description)
      .map((m) => ({ meal: m.meal, description: m.description }));

    await upsertLog({
      date: format(date, "yyyy-MM-dd"),
      calories: hasMealData ? totals.calories : null,
      protein: hasMealData ? totals.protein : null,
      carbs: hasMealData ? totals.carbs : null,
      fats: hasMealData ? totals.fats : null,
      gear_json: [],
      food_json: foodJson,
      exercise_json: [],
      whoop_json: {},
      meals_json: mealsJson,
      client_notes: clientNotes || null,
    });

    setIsUpdate(true);
    setSaving(false);
    setSaved(true);
  }

  if (!auth || auth.role !== "client") return null;

  const current = getMeal(activeMeal);

  return (
    <div className="min-h-screen pb-8">
      <Nav role="client" />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-2xl font-black">Daily Log</h1>
          <DateSelector date={date} onChange={setDate} />
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Nutrition by Meal */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <h2 className="text-xs font-black text-muted uppercase tracking-wider">Nutrition</h2>

            {/* Meal selector buttons */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {MEALS.map((meal) => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => setActiveMeal(meal)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 relative ${
                    activeMeal === meal
                      ? "bg-accent text-white shadow-[0_0_15px_var(--color-accent-glow)]"
                      : mealHasData(meal)
                      ? "bg-success/20 text-success border-2 border-success/30"
                      : "bg-background border-2 border-border text-muted hover:text-white hover:border-accent"
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>

            {/* Active meal inputs */}
            <div className="border-l-2 border-accent pl-3 space-y-3">
              <p className="text-xs font-black text-accent uppercase tracking-wider">{activeMeal}</p>
              <textarea
                value={current.description}
                onChange={(e) => updateMealField(activeMeal, "description", e.target.value)}
                rows={2}
                placeholder="What did you eat?"
                className={inputClass + " resize-none"}
              />
              <div className="grid grid-cols-2 gap-3">
                {(["calories", "protein", "carbs", "fats"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">
                      {field === "calories" ? "Calories" : field === "protein" ? "Protein (g)" : field === "carbs" ? "Carbs (g)" : "Fats (g)"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={current[field]}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || /^\d*\.?\d*$/.test(v)) updateMealField(activeMeal, field, v);
                        }}
                        className={inputClass + " pr-8"}
                        placeholder="0"
                      />
                      {current[field] && (
                        <button
                          type="button"
                          onClick={() => updateMealField(activeMeal, field, "")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-danger text-sm font-black transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Notes */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <h2 className="text-xs font-black text-muted uppercase tracking-wider">Notes</h2>
            <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} rows={3} placeholder="How are you feeling? Anything notable?" className={inputClass + " resize-none"} />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-2xl px-6 py-4 text-base font-black uppercase tracking-wider transition-all hover:shadow-[0_0_30px_var(--color-accent-glow)] active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Saving..." : isUpdate ? "Update" : "Save"}
            </button>
            {saved && <span className="text-success text-sm font-black">Saved!</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
