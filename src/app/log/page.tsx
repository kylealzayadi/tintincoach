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

interface FoodBlock {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const PRESET_BLOCKS: FoodBlock[] = [
  { id: "oikos", name: "Oikos Triple Zero", emoji: "🥣", calories: 100, protein: 15, carbs: 14, fats: 0 },
  { id: "premier", name: "Premier Protein", emoji: "🥤", calories: 160, protein: 30, carbs: 5, fats: 3 },
  { id: "egg", name: "Egg", emoji: "🥚", calories: 70, protein: 6, carbs: 1, fats: 5 },
  { id: "rice", name: "White Rice (1 cup)", emoji: "🍚", calories: 205, protein: 4, carbs: 45, fats: 1 },
];

const STORAGE_KEY = "tintin-food-blocks";

function loadCustomBlocks(): FoodBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomBlocks(blocks: FoodBlock[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

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
  const [customBlocks, setCustomBlocks] = useState<FoodBlock[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [newBlock, setNewBlock] = useState({ name: "", emoji: "🍽️", calories: "", protein: "", carbs: "", fats: "" });

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.role === "coach") { router.replace("/coach"); }
    window.scrollTo(0, 0);
  }, [auth, router]);

  useEffect(() => {
    setCustomBlocks(loadCustomBlocks());
  }, []);

  useEffect(() => {
    loadDay();
    setSaved(false);
  }, [date]);

  async function loadDay() {
    const dateStr = format(date, "yyyy-MM-dd");
    const log = await getLogByDate(dateStr);

    if (log) {
      setIsUpdate(true);
      const rawNotes = log.client_notes ?? "";
      const metaMatch = rawNotes.match(/^\[.*?\]\n?([\s\S]*)$/);
      setClientNotes(metaMatch ? metaMatch[1] : rawNotes);

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

  function addBlock(block: FoodBlock) {
    setMeals((prev) => {
      const cur = prev[activeMeal] ?? emptyMeal;
      const add = (a: string, b: number) => String((a ? Number(a) : 0) + b);
      return {
        ...prev,
        [activeMeal]: {
          description: cur.description ? `${cur.description}, ${block.name}` : block.name,
          calories: add(cur.calories, block.calories),
          protein: add(cur.protein, block.protein),
          carbs: add(cur.carbs, block.carbs),
          fats: add(cur.fats, block.fats),
        },
      };
    });
  }

  function createBlock() {
    if (!newBlock.name.trim()) return;
    const block: FoodBlock = {
      id: Date.now().toString(),
      name: newBlock.name.trim(),
      emoji: newBlock.emoji || "🍽️",
      calories: Number(newBlock.calories) || 0,
      protein: Number(newBlock.protein) || 0,
      carbs: Number(newBlock.carbs) || 0,
      fats: Number(newBlock.fats) || 0,
    };
    const updated = [...customBlocks, block];
    setCustomBlocks(updated);
    saveCustomBlocks(updated);
    setNewBlock({ name: "", emoji: "🍽️", calories: "", protein: "", carbs: "", fats: "" });
  }

  function deleteBlock(id: string) {
    const updated = customBlocks.filter((b) => b.id !== id);
    setCustomBlocks(updated);
    saveCustomBlocks(updated);
  }

  const allBlocks = [...PRESET_BLOCKS, ...customBlocks];

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
      client_notes: clientNotes.trim()
        ? `[${activeMeal} • ${format(new Date(), "h:mm a")}]\n${clientNotes.trim()}`
        : null,
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black">Daily Log</h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-95 hover:shadow-[0_0_20px_var(--color-accent-glow)]"
            >
              Dashboard
            </button>
          </div>
          <DateSelector date={date} onChange={setDate} />
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Nutrition by Meal */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-muted uppercase tracking-wider">Nutrition</h2>
              {mealHasData(activeMeal) && (
                <button
                  type="button"
                  onClick={() => setMeals((prev) => ({ ...prev, [activeMeal]: emptyMeal }))}
                  className="text-[10px] font-black text-danger/70 hover:text-danger uppercase tracking-wider transition active:scale-95"
                >
                  Clear All
                </button>
              )}
            </div>

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

            {/* Food blocks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">Quick Add</p>
                <button
                  type="button"
                  onClick={() => setShowSaved(!showSaved)}
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg transition-all active:scale-95 ${
                    showSaved ? "bg-accent text-white" : "text-accent hover:text-accent-hover"
                  }`}
                >
                  Saved Items
                </button>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {allBlocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => addBlock(block)}
                    className="flex-shrink-0 bg-background border-2 border-border hover:border-accent rounded-xl px-2.5 py-1.5 transition-all active:scale-95 text-left"
                  >
                    <span className="text-sm">{block.emoji}</span>
                    <p className="text-[10px] font-black text-white leading-tight mt-0.5">{block.name}</p>
                    <p className="text-[9px] font-bold text-muted">{block.calories}cal · {block.protein}p</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved items panel */}
            {showSaved && (
              <div className="bg-background border-2 border-border rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-black text-muted uppercase tracking-wider">Manage Saved Items</p>
                {customBlocks.length > 0 && (
                  <div className="space-y-1.5">
                    {customBlocks.map((block) => (
                      <div key={block.id} className="flex items-center justify-between bg-card rounded-lg px-2.5 py-1.5">
                        <div>
                          <span className="text-sm mr-1">{block.emoji}</span>
                          <span className="text-xs font-black text-white">{block.name}</span>
                          <span className="text-[9px] font-bold text-muted ml-2">{block.calories}cal · {block.protein}p · {block.carbs}c · {block.fats}f</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteBlock(block.id)}
                          className="text-muted hover:text-danger text-sm font-black transition ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-[10px] font-black text-success uppercase tracking-wider">Create New</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBlock.emoji}
                      onChange={(e) => setNewBlock({ ...newBlock, emoji: e.target.value })}
                      className="w-10 bg-card border-2 border-border rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none focus:border-accent transition"
                      placeholder="🍽️"
                    />
                    <input
                      type="text"
                      value={newBlock.name}
                      onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                      className="flex-1 bg-card border-2 border-border rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-accent transition placeholder:text-muted/50"
                      placeholder="Item name"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["calories", "protein", "carbs", "fats"] as const).map((f) => (
                      <input
                        key={f}
                        type="text"
                        inputMode="decimal"
                        value={newBlock[f]}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || /^\d*\.?\d*$/.test(v)) setNewBlock({ ...newBlock, [f]: v });
                        }}
                        className="bg-card border-2 border-border rounded-lg px-2 py-1.5 text-[10px] font-bold focus:outline-none focus:border-accent transition placeholder:text-muted/50"
                        placeholder={f === "calories" ? "Cal" : f === "protein" ? "Pro" : f === "carbs" ? "Carb" : "Fat"}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={createBlock}
                    disabled={!newBlock.name.trim()}
                    className="w-full bg-success/20 hover:bg-success/30 text-success rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider transition disabled:opacity-50 active:scale-95"
                  >
                    Save Item
                  </button>
                </div>
              </div>
            )}

            {/* Active meal inputs */}
            <div className="border-l-2 border-accent pl-3 space-y-3">
              <p className="text-xs font-black text-accent uppercase tracking-wider">{activeMeal}</p>
              <div className="relative">
                <textarea
                  value={current.description}
                  onChange={(e) => updateMealField(activeMeal, "description", e.target.value)}
                  rows={2}
                  placeholder="What did you eat?"
                  className={inputClass + " resize-none pr-8"}
                />
                {current.description && (
                  <button
                    type="button"
                    onClick={() => updateMealField(activeMeal, "description", "")}
                    className="absolute right-2 top-3 text-muted hover:text-danger text-sm font-black transition"
                  >
                    ✕
                  </button>
                )}
              </div>
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

          {/* Check In */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <h2 className="text-xs font-black text-muted uppercase tracking-wider">Check In</h2>
            <div className="relative">
              <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} rows={3} placeholder="How are you feeling? Anything notable?" className={inputClass + " resize-none pr-8"} />
              {clientNotes && (
                <button
                  type="button"
                  onClick={() => setClientNotes("")}
                  className="absolute right-2 top-3 text-muted hover:text-danger text-sm font-black transition"
                >
                  ✕
                </button>
              )}
            </div>
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
