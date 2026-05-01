"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, upsertLog } from "@/lib/store";
import type { FoodEntry } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";

const inputClass = "w-full bg-background border-2 border-border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-accent focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all placeholder:text-muted/50";

export default function LogPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [food, setFood] = useState<FoodEntry[]>([]);
  const [clientNotes, setClientNotes] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.role === "coach") { router.replace("/coach"); }
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
      setCalories(log.calories?.toString() ?? "");
      setProtein(log.protein?.toString() ?? "");
      setCarbs(log.carbs?.toString() ?? "");
      setFats(log.fats?.toString() ?? "");
      setFood(log.food_json ?? []);
      setClientNotes(log.client_notes ?? "");
    } else {
      setIsUpdate(false);
      setCalories(""); setProtein(""); setCarbs(""); setFats("");
      setFood([]);
      setClientNotes("");
    }
  }

  function addFoodRow() { setFood([...food, { meal: "", description: "" }]); }
  function updateFood(i: number, field: keyof FoodEntry, value: string) {
    const u = [...food]; u[i] = { ...u[i], [field]: value }; setFood(u);
  }
  function removeFood(i: number) { setFood(food.filter((_, idx) => idx !== i)); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await upsertLog({
      date: format(date, "yyyy-MM-dd"),
      calories: calories ? Number(calories) : null,
      protein: protein ? Number(protein) : null,
      carbs: carbs ? Number(carbs) : null,
      fats: fats ? Number(fats) : null,
      gear_json: [],
      food_json: food.filter((f) => f.description.trim()),
      exercise_json: [],
      whoop_json: {},
      client_notes: clientNotes || null,
    });

    setIsUpdate(true);
    setSaving(false);
    setSaved(true);
  }

  if (!auth || auth.role !== "client") return null;

  return (
    <div className="min-h-screen pb-8">
      <Nav role="client" />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-2xl font-black">Daily Log</h1>
          <DateSelector date={date} onChange={setDate} />
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Nutrition */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <h2 className="text-xs font-black text-muted uppercase tracking-wider">Nutrition</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Calories</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Protein (g)</label>
                <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Carbs (g)</label>
                <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Fats (g)</label>
                <input type="number" value={fats} onChange={(e) => setFats(e.target.value)} className={inputClass} placeholder="0" />
              </div>
            </div>
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
