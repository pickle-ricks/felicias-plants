"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabaseClient";
import type { PlantRow, WateringRow } from "@/types/plant";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(dt?: string | Date | null) {
  if (!dt) return "—";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusClass(nextDue?: string | null) {
  if (!nextDue) return "bg-amber-100 text-amber-800";
  const now = new Date();
  const t = new Date(nextDue);
  if (t < now) return "bg-rose-100 text-rose-800";
  const diffDays = Math.round((t.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays <= 1 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800";
}

export default function Home() {
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [waterMap, setWaterMap] = useState<Record<string, WateringRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const csvUrl = "/Plant_Care_Guide.csv";
        const csvText = await fetch(csvUrl).then((r: Response) => r.text());
        const parsed = Papa.parse<PlantRow>(csvText, { header: true }).data.filter((r) => r["Plant Name"]);
        setPlants(parsed);

        if (supabase) {
          const { data, error } = await supabase
            .from("waterings")
            .select("plant_name, category, default_interval_days, last_watered_at, next_water_due_at");
          if (error) throw error;
          const map: Record<string, WateringRow> = {};
          (data || []).forEach((row) => (map[row.plant_name] = row));
          setWaterMap(map);
        }
      } catch (e) {
        console.warn("Skipping Supabase or CSV error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, PlantRow[]> = {};
    for (const p of plants) {
      groups[p.Category] = groups[p.Category] || [];
      groups[p.Category].push(p);
    }
    return groups;
  }, [plants]);

  async function handleSetInterval(plantName: string, category: string, intervalDays: number) {
    if (!supabase) return;
    const row = waterMap[plantName];
    const next = row?.last_watered_at ? addDays(new Date(row.last_watered_at), intervalDays).toISOString() : null;
    const { data, error } = await supabase
      .from("waterings")
      .upsert({
        plant_name: plantName,
        category,
        default_interval_days: intervalDays,
        next_water_due_at: next,
      })
      .select()
      .single();
    if (error) return alert("Failed to save interval");
    setWaterMap((m) => ({ ...m, [plantName]: { ...(m[plantName] || ({} as any)), ...data } }));
  }

  async function handleMarkWatered(plantName: string, category: string, intervalDays: number) {
    if (!supabase) return;
    const nowIso = new Date().toISOString();
    const nextIso = addDays(new Date(), intervalDays).toISOString();
    const { data, error } = await supabase
      .from("waterings")
      .upsert({
        plant_name: plantName,
        category,
        default_interval_days: intervalDays,
        last_watered_at: nowIso,
        next_water_due_at: nextIso,
      })
      .select()
      .single();
    if (error) return alert("Failed to mark watered");
    setWaterMap((m) => ({ ...m, [plantName]: { ...(m[plantName] || ({} as any)), ...data } }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1200px] mx-auto p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-emerald-900 mb-8">🌱 Felicia&apos;s Plant Care Guide</h1>
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="mb-12">
            <h2 className="text-2xl font-semibold text-emerald-900 border-b border-emerald-700/30 pb-2 mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((plant) => {
                const w = waterMap[plant["Plant Name"]];
                const intervalDefault = w?.default_interval_days ?? (category.toLowerCase().includes("succulent") || category.toLowerCase().includes("cacti") ? 21 : 7);
                const nextDue = w?.next_water_due_at || (w?.last_watered_at && intervalDefault ? addDays(new Date(w.last_watered_at), intervalDefault).toISOString() : null);
                return (
                  <article key={plant["Plant Name"]} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
                    <div className="relative aspect-[4/3] bg-neutral-100">
                      <Image
                        src={`/Felicias-Plants/${plant["Image File"].replace(/\\/g, "/")}`}
                        alt={plant["Plant Name"]}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <h3 className="text-lg font-semibold text-emerald-900">{plant["Plant Name"]}</h3>
                      <ul className="text-sm text-neutral-800 space-y-1">
                        <li><span className="mr-2">☀️</span><strong>Light:</strong> {plant.Light}</li>
                        <li><span className="mr-2">💧</span><strong>Water:</strong> {plant.Water}</li>
                        <li><span className="mr-2">🌱</span><strong>Notes:</strong> {plant.Notes}</li>
                      </ul>
                      <div className="mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-2">
                        <div className="text-sm text-emerald-900/90">
                          Next water: {formatDate(nextDue)}{" "}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${statusClass(nextDue || null)}`}>
                            {nextDue ? "scheduled" : "set schedule"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-neutral-600">Interval</label>
                          <input
                            defaultValue={intervalDefault}
                            min={1}
                            type="number"
                            className="w-20 px-2 py-1 border border-neutral-300 rounded-md"
                            onChange={(e) => handleSetInterval(plant["Plant Name"], plant.Category, parseInt(e.target.value || "0", 10) || intervalDefault)}
                          />
                        </div>
                        <button
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm px-3 py-2 rounded-md"
                          onClick={() => handleMarkWatered(plant["Plant Name"], plant.Category, intervalDefault)}
                        >
                          Mark watered
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
