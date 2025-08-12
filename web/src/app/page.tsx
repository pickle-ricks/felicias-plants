"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import type { PlantRow } from "@/types/plant";
import WateringCard from "@/components/WateringCard";

type ImageWithFallbackProps = {
  candidates: string[];
  alt: string;
  className?: string;
};

function ImageWithFallback({ candidates, alt, className }: ImageWithFallbackProps) {
  const [index, setIndex] = useState(0);
  const src = candidates[Math.min(index, Math.max(candidates.length - 1, 0))] || "";
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      onError={() => setIndex((i) => (i + 1 < candidates.length ? i + 1 : i))}
    />
  );
}

function toSlugUnderscore(input: string): string {
  return input
    .toLowerCase()
    .replace(/\([^)]*\)/g, "") // remove parenthetical content
    .replace(/[^a-z0-9]+/g, "_") // non-alphanum → underscore
    .replace(/_+/g, "_") // collapse underscores
    .replace(/^_+|_+$/g, ""); // trim underscores
}

function ensureJpgExtension(filename: string): string {
  const trimmed = filename.trim();
  if (/\.(jpe?g)$/i.test(trimmed)) {
    return trimmed.replace(/\.jpeg$/i, ".jpg");
  }
  if (!trimmed) return trimmed;
  return `${trimmed}.jpg`;
}

function basename(path: string): string {
  const norm = path.replace(/\\/g, "/");
  const parts = norm.split("/");
  return parts[parts.length - 1];
}

function buildImageCandidates(plant: PlantRow): string[] {
  const candidates = new Set<string>();
  const raw = basename(plant["Image File"] || "");
  const primary = ensureJpgExtension(raw);
  if (primary) candidates.add(`/Felicias-Plants/${primary}`);

  // Minimal fallback: slug of plant name with .jpg
  const nameSlug = toSlugUnderscore(plant["Plant Name"] || "");
  if (nameSlug) candidates.add(`/Felicias-Plants/${nameSlug}.jpg`);

  return Array.from(candidates);
}

type HumidityLevel = "low" | "moderate" | "high";

function inferHumidity(plant: PlantRow): { level: HumidityLevel; label: string; range: string } {
  const notes = (plant.Notes || "").toLowerCase();
  const category = (plant.Category || "").toLowerCase();

  const saysLow = /very\s+low\s+humidity|low\s+humidity/.test(notes);
  const saysHigh = /high\s+humidity|humidity\s+is\s+essential|essential\s+humidity/.test(notes);
  const saysModerate = /moderate\s+humidity|medium\s+humidity/.test(notes);
  const saysModHigh = /moderate\s+to\s+high/.test(notes);

  let level: HumidityLevel | null = null;
  if (saysLow) level = "low";
  else if (saysHigh || saysModHigh) level = "high";
  else if (saysModerate) level = "moderate";

  if (!level) {
    if (category.includes("succulent") || category.includes("cacti")) level = "low";
    else if (category.includes("tropical")) level = "high";
    else level = "moderate";
  }

  const range = level === "low" ? "30–40%" : level === "moderate" ? "40–50%" : "60–80%";
  const label = `${level[0].toUpperCase()}${level.slice(1)} (${range})`;
  return { level, label, range };
}

export default function Home() {
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const csvUrl = "/Plant_Care_Guide.csv";
        const csvText = await fetch(csvUrl).then((r: Response) => r.text());
        const parsed = Papa.parse<PlantRow>(csvText, { header: true }).data.filter((r) => (r["Plant Name"] || "").trim());
        setPlants(parsed);
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
      const category = (p.Category || "Uncategorized").trim() || "Uncategorized";
      groups[category] = groups[category] || [];
      groups[category].push(p);
    }
    return groups;
  }, [plants]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6 sm:p-10">
      <div className="relative">
        <div className="floating-petals" aria-hidden="true">
          <span>🌸</span>
          <span>🍃</span>
          <span>🌼</span>
          <span>💮</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl text-emerald-700 mb-3">
          Felicia&apos;s Plant Care Guide
        </h1>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-12">
          <h2 className="text-2xl font-semibold text-emerald-700 border-b border-emerald-300/60 pb-2 mb-4 flex items-center gap-2">
            <span className="text-emerald-500">🌿</span> {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((plant) => (
              <article key={plant["Plant Name"]} className="card-cute overflow-hidden flex flex-col">
                <div className="relative aspect-[3/4] bg-pink-50/60">
                  <ImageWithFallback
                    candidates={buildImageCandidates(plant)}
                    alt={plant["Plant Name"]}
                    className="object-contain p-1"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
                    {plant["Plant Name"]}
                  </h3>
                  <ul className="text-sm text-emerald-900/90 space-y-1">
                    <li><span className="mr-2">☀️</span><strong>Light:</strong> {plant.Light}</li>
                    <li><span className="mr-2">💧</span><strong>Water:</strong> {plant.Water}</li>
                    <li><span className="mr-2">🌱</span><strong>Notes:</strong> {plant.Notes}</li>
                    <li className="flex items-center gap-2">
                      <span>💧💨</span>
                      <strong>Humidity:</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${(() => {
                        const { level } = inferHumidity(plant);
                        return level === "low"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : level === "moderate"
                          ? "bg-green-100 text-emerald-800 border border-emerald-200"
                          : "bg-pink-100 text-pink-700 border border-pink-200";
                      })()}`}>
                        {inferHumidity(plant).label}
                      </span>
                    </li>
                  </ul>
                  <WateringCard plantName={plant["Plant Name"]} category={plant.Category} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
