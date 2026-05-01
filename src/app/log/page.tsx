"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, upsertLog } from "@/lib/local-store";
import type { GearEntry, FoodEntry, ExerciseEntry, WhoopData } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";
import WhoopConnect, { getWhoopForDate } from "@/components/WhoopConnect";

const inputClass = "w-full bg-background border-2 border-border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-accent focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all placeholder:text-muted/50";

export default function LogPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [gear, setGear] = useState<GearEntry[]>([]);
  const [food, setFood] = useState<FoodEntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [whoopRecovery, setWhoopRecovery] = useState("");
  const [whoopStrain, setWhoopStrain] = useState("");
  const [whoopSleep, setWhoopSleep] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.role === "coach") { router.replace("/coach"); }
  }, [auth, router]);

  useEffect(() => {
    const dateStr = format(date, "yyyy-MM-dd");
    const log = getLogByDate(dateStr);
    setSaved(false);

    if (log) {
      setIsUpdate(true);
      setCalories(log.calories?.toString() ?? "");
      setProtein(log.protein?.toString() ?? "");
      setCarbs(log.carbs?.toString() ?? "");
      setFats(log.fats?.toString() ?? "");
      setGear(log.gear_json ?? []);
      setFood(log.food_json ?? []);
      setExercises(log.exercise_json ?? []);
      setWhoopRecovery(log.whoop_json?.recovery?.toString() ?? "");
      setWhoopStrain(log.whoop_json?.strain?.toString() ?? "");
      setWhoopSleep(log.whoop_json?.sleep?.toString() ?? "");
      setClientNotes(log.client_notes ?? "");
    } else {
      setIsUpdate(false);
      setCalories(""); setProtein(""); setCarbs(""); setFats("");
      setGear([]); setFood([]); setExercises([]);
      setWhoopRecovery(""); setWhoopStrain(""); setWhoopSleep("");
      setClientNotes("");
    }
  }, [date]);

  // Gear
  function addGearRow() { setGear([...gear, { compound: "", dose: "" }]); }
  function updateGear(i: number, field: keyof GearEntry, value: string) {
    const u = [...gear]; u[i] = { ...u[i], [field]: value }; setGear(u);
  }
  function removeGear(i: number) { setGear(gear.filter((_, idx) => idx !== i)); }

  // Food
  function addFoodRow() { setFood([...food, { meal: "", description: "" }]); }
  function updateFood(i: number, field: keyof FoodEntry, value: string) {
    const u = [...food]; u[i] = { ...u[i], [field]: value }; setFood(u);
  }
  function removeFood(i: number) { setFood(food.filter((_, idx) => idx !== i)); }

  // Exercise
  function addExerciseRow() { setExercises([...exercises, { exercise: "", sets: "", reps: "", weight: "", notes: "" }]); }
  function updateExercise(i: number, field: keyof ExerciseEntry, value: string) {
    const u = [...exercises]; u[i] = { ...u[i], [field]: value }; setExercises(u);
  }
  function removeExercise(i: number) { setExercises(exercises.filter((_, idx) => idx !== i)); }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const whoopJson: WhoopData = {};
    if (whoopRecovery) whoopJson.recovery = Number(whoopRecovery);
    if (whoopStrain) whoopJson.strain = Number(whoopStrain);
    if (whoopSleep) whoopJson.sleep = Number(whoopSleep);

    upsertLog({
      date: format(date, "yyyy-MM-dd"),
      calories: calories ? Number(calories) : null,
      protein: protein ? Number(protein) : null,
      carbs: carbs ? Number(carbs) : null,
      fats: fats ? Number(fats) : null,
      gear_json: gear.filter((g) => g.compound.trim()),
      food_json: food.filter((f) => f.description.trim()),
      exercise_json: exercises.filter((ex) => ex.exercise.trim()),
      whoop_json: whoopJson,
      client_notes: clientNotes || null,
    });

    setIsUpdate(true);
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
              <button type="button" onClick={addFoodRow} className="text-xs font-black text-accent hover:text-accent-hover transition active:scale-95">
                + Add meal
              </button>
            </div>
            {food.length === 0 && <p className="text-muted text-sm font-bold">No meals logged</p>}
            {food.map((entry, i) => (
              <div key={i} className="space-y-2 border-l-2 border-warning pl-3">
                <div className="flex gap-2 items-center">
                  <select
                    value={entry.meal}
                    onChange={(e) => updateFood(i, "meal", e.target.value)}
                    className={inputClass + " w-32 flex-shrink-0"}
                  >
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
                <textarea
                  value={entry.description}
                  onChange={(e) => updateFood(i, "description", e.target.value)}
                  placeholder="What did you eat?"
                  rows={2}
                  className={inputClass + " resize-none"}
                />
              </div>
            ))}
          </div>

          {/* Exercise */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-muted uppercase tracking-wider">Exercise</h2>
              <button type="button" onClick={addExerciseRow} className="text-xs font-black text-accent hover:text-accent-hover transition active:scale-95">
                + Add exercise
              </button>
            </div>
            {exercises.length === 0 && <p className="text-muted text-sm font-bold">No exercises logged</p>}
            {exercises.map((entry, i) => (
              <div key={i} className="space-y-2 border-l-2 border-cyan pl-3">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={entry.exercise}
                    onChange={(e) => updateExercise(i, "exercise", e.target.value)}
                    placeholder="Exercise name"
                    className={inputClass + " flex-1"}
                  />
                  <button type="button" onClick={() => removeExercise(i)} className="text-muted hover:text-danger text-sm font-black transition px-2">x</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={entry.sets} onChange={(e) => updateExercise(i, "sets", e.target.value)} placeholder="Sets" className={inputClass} />
                  <input type="text" value={entry.reps} onChange={(e) => updateExercise(i, "reps", e.target.value)} placeholder="Reps" className={inputClass} />
                  <input type="text" value={entry.weight} onChange={(e) => updateExercise(i, "weight", e.target.value)} placeholder="Weight" className={inputClass} />
                </div>
                <input type="text" value={entry.notes} onChange={(e) => updateExercise(i, "notes", e.target.value)} placeholder="Notes (optional)" className={inputClass} />
              </div>
            ))}
          </div>

          {/* WHOOP */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-black text-muted uppercase tracking-wider">WHOOP</h2>
              <WhoopConnect
                date={format(date, "yyyy-MM-dd")}
                onSync={() => {
                  const w = getWhoopForDate(format(date, "yyyy-MM-dd"));
                  if (w) {
                    if (w.recovery != null) setWhoopRecovery(String(w.recovery));
                    if (w.strain != null) setWhoopStrain(String(w.strain));
                    if (w.sleep != null) setWhoopSleep(String(w.sleep));
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Recovery %</label>
                <input type="number" value={whoopRecovery} onChange={(e) => setWhoopRecovery(e.target.value)} className={inputClass} placeholder="0" min="0" max="100" />
              </div>
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Strain</label>
                <input type="number" step="0.1" value={whoopStrain} onChange={(e) => setWhoopStrain(e.target.value)} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-wider mb-1">Sleep (hrs)</label>
                <input type="number" step="0.1" value={whoopSleep} onChange={(e) => setWhoopSleep(e.target.value)} className={inputClass} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Gear */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-muted uppercase tracking-wider">Gear</h2>
              <button type="button" onClick={addGearRow} className="text-xs font-black text-accent hover:text-accent-hover transition active:scale-95">
                + Add compound
              </button>
            </div>
            {gear.length === 0 && <p className="text-muted text-sm font-bold">No gear logged</p>}
            {gear.map((entry, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={entry.compound} onChange={(e) => updateGear(i, "compound", e.target.value)} placeholder="Compound" className={inputClass + " flex-1"} />
                <input type="text" value={entry.dose} onChange={(e) => updateGear(i, "dose", e.target.value)} placeholder="Dose" className={inputClass + " w-28"} />
                <button type="button" onClick={() => removeGear(i)} className="text-muted hover:text-danger text-sm font-black transition px-2">x</button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
            <h2 className="text-xs font-black text-muted uppercase tracking-wider">Notes</h2>
            <textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={3}
              placeholder="How are you feeling? Anything notable?"
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-2xl px-6 py-4 text-base font-black uppercase tracking-wider transition-all hover:shadow-[0_0_30px_var(--color-accent-glow)] active:scale-[0.98]"
            >
              {isUpdate ? "Update" : "Save"}
            </button>
            {saved && <span className="text-success text-sm font-black">Saved!</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
