"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, upsertLog } from "@/lib/store";
import type { FoodEntry, MealMacros } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";

const inputClass = "w-full bg-background border-2 border-border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-accent focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all placeholder:text-muted/50";

const MEALS = ["Breakfast", "AM Snack", "Lunch", "PM Snack", "Dinner"] as const;

type MealFields = { calories: string; protein: string; carbs: string; fats: string };
const emptyMeal: MealFields = { calories: "", protein: "", carbs: "", fats: "" };

export default function LogPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState<Record<string, MealFields>>({});
  const [activeMeal, setActiveMeal] = useState<string>(MEALS[0]);
  const [food, setFood] = useState<FoodEntry[]>([]);
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
      setFood(log.food_json ?? []);
      setClientNotes(log.client_notes ?? "");

      const loaded: Record<string, MealFields> = {};
      if (log.meals_json && log.meals_json.length > 0) {
        for (const m of log.meals_json) {
          loaded[m.meal] = {
            calories: m.calories?.toString() ?? "",
            protein: m.protein?.toString() ?? "",
            carbs: m.carbs?.toString() ?? "",
            fats: m.fats?.toString() ?? "",
          };
        }
      } else if (log.calories || log.protein || log.carbs || log.fats) {
        loaded["Breakfast"] = {
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
      setFood([]);
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
    return !!(m.calories || m.protein || m.carbs || m.fats);
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

  function addFoodRow() { setFood([...food, { meal: "", description: "" }]); }
  function updateFood(i: number, field: keyof FoodEntry, value: string) {
    const u = [...food]; u[i] = { ...u[i], [field]: value }; setFood(u);
  }
  function removeFood(i: number) { setFood(food.filter((_, idx) => idx !== i)); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const mealsJson: MealMacros[] = MEALS
      .filter(mealHasData)
      .map((meal) => {
        const m = meals[meal]!;
        return {
          meal,
          calories: m.calories ? Number(m.calories) : null,
          protein: m.protein ? Number(m.protein) : null,
          carbs: m.carbs ? Number(m.carbs) : null,
          fats: m.fats ? Number(m.fats) : null,
        };
      });

    await upsertLog({
      date: format(date, "yyyy-MM-dd"),
      calories: hasMealData ? totals.calories : null,
      protein: hasMealData ? totals.protein : null,
      carbs: hasMealData ? totals.carbs : null,
      fats: hasMealData ? totals.fats : null,
      gear_json: [],
      food_json: food.filter((f) => f.description.trim()),
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Calories</label>
                  <input type="number" value={current.calories} onChange={(e) => updateMealField(activeMeal, "calories", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Protein (g)</label>
                  <input type="number" value={current.protein} onChange={(e) => updateMealField(activeMeal, "protein", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Carbs (g)</label>
                  <input type="number" value={current.carbs} onChange={(e) => updateMealField(activeMeal, "carbs", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Fats (g)</label>
                  <input type="number" value={current.fats} onChange={(e) => updateMealField(activeMeal, "fats", e.target.value)} className={inputClass} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Per-meal summary */}
            {hasMealData && (
              <div className="space-y-2 pt-2 border-t border-border">
                {MEALS.filter(mealHasData).map((meal) => {
                  const m = meals[meal]!;
                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => setActiveMeal(meal)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all active:scale-[0.98] ${
                        activeMeal === meal ? "bg-accent/10 border border-accent/30" : "hover:bg-background"
                      }`}
                    >
                      <span className="text-xs font-black text-white uppercase tracking-wider">{meal}</span>
                      <span className="text-xs font-bold text-muted">
                        {m.calories || 0}
                        <span className="text-white/40"> cal</span>
                        {" · "}
                        {m.protein || 0}
                        <span className="text-cyan/60">p</span>
                        {" · "}
                        {m.carbs || 0}
                        <span className="text-warning/60">c</span>
                        {" · "}
                        {m.fats || 0}
                        <span className="text-pink/60">f</span>
                      </span>
                    </button>
                  );
                })}

                {/* Totals */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-background border-2 border-border">
                  <span className="text-xs font-black text-accent uppercase tracking-wider">Total</span>
                  <span className="text-xs font-black">
                    <span className="text-white">{totals.calories}</span>
                    <span className="text-white/40"> cal</span>
                    {" · "}
                    <span className="text-cyan">{totals.protein}</span>
                    <span className="text-cyan/60">p</span>
                    {" · "}
                    <span className="text-warning">{totals.carbs}</span>
                    <span className="text-warning/60">c</span>
                    {" · "}
                    <span className="text-pink">{totals.fats}</span>
                    <span className="text-pink/60">f</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Food Log */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-muted uppercase tracking-wider">Food Log</h2>
              <button type="button" onClick={addFoodRow} className="text-xs font-black text-accent hover:text-accent-hover transition active:scale-95">+ Add meal</button>
            </div>
            {food.length === 0 && <p className="text-muted text-sm font-bold">No meals logged</p>}
            {food.map((entry, i) => (
              <div key={i} className="space-y-2 border-l-2 border-warning pl-3">
                <div className="flex gap-2 items-center">
                  <select value={entry.meal} onChange={(e) => updateFood(i, "meal", e.target.value)} className={inputClass + " w-32 flex-shrink-0"}>
                    <option value="">Meal</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                    <option value="Pre-workout">Pre-workout</option>
                    <option value="Post-workout">Post-workout</option>
                  </select>
                  <button type="button" onClick={() => removeFood(i)} className="text-muted hover:text-danger text-sm font-black transition px-2">x</button>
                </div>
                <textarea value={entry.description} onChange={(e) => updateFood(i, "description", e.target.value)} placeholder="What did you eat?" rows={2} className={inputClass + " resize-none"} />
              </div>
            ))}
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
