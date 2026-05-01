"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLogByDate, upsertLog } from "@/lib/local-store";
import type { GearEntry, WhoopData } from "@/lib/types";
import Nav from "@/components/Nav";
import DateSelector from "@/components/DateSelector";
import WhoopConnect from "@/components/WhoopConnect";

export default function LogPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [gear, setGear] = useState<GearEntry[]>([]);
  const [whoopRecovery, setWhoopRecovery] = useState("");
  const [whoopStrain, setWhoopStrain] = useState("");
  const [whoopSleep, setWhoopSleep] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
      return;
    }
    if (auth.role === "coach") {
      router.replace("/coach");
    }
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
      setWhoopRecovery(log.whoop_json?.recovery?.toString() ?? "");
      setWhoopStrain(log.whoop_json?.strain?.toString() ?? "");
      setWhoopSleep(log.whoop_json?.sleep?.toString() ?? "");
      setClientNotes(log.client_notes ?? "");
    } else {
      setIsUpdate(false);
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setGear([]);
      setWhoopRecovery("");
      setWhoopStrain("");
      setWhoopSleep("");
      setClientNotes("");
    }
  }, [date]);

  function addGearRow() {
    setGear([...gear, { compound: "", dose: "" }]);
  }

  function updateGear(index: number, field: keyof GearEntry, value: string) {
    const updated = [...gear];
    updated[index] = { ...updated[index], [field]: value };
    setGear(updated);
  }

  function removeGear(index: number) {
    setGear(gear.filter((_, i) => i !== index));
  }

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
      whoop_json: whoopJson,
      client_notes: clientNotes || null,
    });

    setIsUpdate(true);
    setSaved(true);
  }

  if (!auth || auth.role !== "client") return null;

  return (
    <div className="min-h-screen">
      <Nav role="client" />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl font-semibold">Daily Log</h1>
          <DateSelector date={date} onChange={setDate} />
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Macros */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-medium text-muted">Nutrition</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* WHOOP */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-medium text-muted">WHOOP</h2>
              <WhoopConnect
                date={format(date, "yyyy-MM-dd")}
                onData={(data) => {
                  if (data.recovery != null) setWhoopRecovery(String(data.recovery));
                  if (data.strain != null) setWhoopStrain(String(data.strain));
                  if (data.sleep != null) setWhoopSleep(String(data.sleep));
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1">Recovery %</label>
                <input
                  type="number"
                  value={whoopRecovery}
                  onChange={(e) => setWhoopRecovery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Strain</label>
                <input
                  type="number"
                  step="0.1"
                  value={whoopStrain}
                  onChange={(e) => setWhoopStrain(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Sleep (hrs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={whoopSleep}
                  onChange={(e) => setWhoopSleep(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Gear */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">Gear</h2>
              <button
                type="button"
                onClick={addGearRow}
                className="text-xs text-accent hover:text-accent-hover transition"
              >
                + Add compound
              </button>
            </div>
            {gear.length === 0 && (
              <p className="text-muted text-sm">No gear logged</p>
            )}
            {gear.map((entry, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={entry.compound}
                  onChange={(e) => updateGear(i, "compound", e.target.value)}
                  placeholder="Compound"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  value={entry.dose}
                  onChange={(e) => updateGear(i, "dose", e.target.value)}
                  placeholder="Dose"
                  className="w-28 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => removeGear(i)}
                  className="text-muted hover:text-danger text-sm transition px-1"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-medium text-muted">Notes</h2>
            <textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={3}
              placeholder="How are you feeling? Anything notable?"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-accent hover:bg-accent-hover text-white rounded-lg px-6 py-2 text-sm font-medium transition"
            >
              {isUpdate ? "Update" : "Save"}
            </button>
            {saved && <span className="text-success text-sm">Saved</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
