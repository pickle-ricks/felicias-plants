"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { WateringRow } from "@/types/plant";

type WateringCardProps = {
  plantName: string;
  category: string;
};

function addDays(input: Date, days: number): Date {
  const d = new Date(input);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(dt?: string | Date | null): string {
  if (!dt) return "—";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function WateringCard({ plantName, category }: WateringCardProps) {
  const [row, setRow] = useState<WateringRow | null>(null);
  const [intervalDays, setIntervalDays] = useState<number>(7);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supaAvailable = Boolean(supabase);

  const isOverdue = useMemo(() => {
    if (!row?.next_water_due_at) return false;
    const t = new Date(row.next_water_due_at);
    return t.getTime() < Date.now();
  }, [row?.next_water_due_at]);

  async function load() {
    if (!supabase) return;
    const client = supabase;
    setErrorMessage(null);
    const { data, error } = await client
      .from("waterings")
      .select(
        "plant_name, category, default_interval_days, last_watered_at, next_water_due_at"
      )
      .eq("plant_name", plantName)
      .maybeSingle();
    if (error) {
      setErrorMessage("Failed to load watering status");
      return;
    }
    const initialInterval =
      data?.default_interval_days ??
      (category.toLowerCase().includes("succulent") || category.toLowerCase().includes("cacti")
        ? 21
        : 7);
    setIntervalDays(initialInterval);
    setRow(
      data ?? {
        plant_name: plantName,
        category,
        default_interval_days: initialInterval,
        last_watered_at: null,
        next_water_due_at: null,
      }
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantName]);

  async function saveInterval(newInterval: number) {
    if (!supabase || !Number.isFinite(newInterval) || newInterval <= 0) return;
    const client = supabase;
    setErrorMessage(null);
    const nextDue = row?.last_watered_at
      ? addDays(new Date(row.last_watered_at), newInterval).toISOString()
      : row?.next_water_due_at ?? null;
    const { data, error } = await client
      .from("waterings")
      .upsert({
        plant_name: plantName,
        category,
        default_interval_days: newInterval,
        next_water_due_at: nextDue,
      })
      .select()
      .single();
    if (error) {
      setErrorMessage("Failed to save interval");
      return;
    }
    setIntervalDays(newInterval);
    setRow((prev) => ({
      plant_name: data.plant_name,
      category: data.category ?? prev?.category ?? category,
      default_interval_days: data.default_interval_days ?? prev?.default_interval_days ?? newInterval,
      last_watered_at: data.last_watered_at ?? prev?.last_watered_at ?? null,
      next_water_due_at: data.next_water_due_at ?? prev?.next_water_due_at ?? nextDue ?? null,
    }));
  }

  async function markWatered() {
    if (!supabase) return;
    const client = supabase;
    setErrorMessage(null);
    startTransition(async () => {
      const nowIso = new Date().toISOString();
      const nextIso = addDays(new Date(), intervalDays).toISOString();
      const { data, error } = await client
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
      if (error) {
        setErrorMessage("Failed to mark watered");
        return;
      }
      setRow((prev) => ({
        plant_name: data.plant_name,
        category: data.category ?? prev?.category ?? category,
        default_interval_days:
          data.default_interval_days ?? prev?.default_interval_days ?? intervalDays,
        last_watered_at: data.last_watered_at ?? nowIso,
        next_water_due_at: data.next_water_due_at ?? nextIso,
      }));
    });
  }

  async function snoozeTwoDays() {
    if (!supabase) return;
    const client = supabase;
    setErrorMessage(null);
    startTransition(async () => {
      const base = row?.next_water_due_at ? new Date(row.next_water_due_at) : new Date();
      const snoozed = addDays(base, 2).toISOString();
      const { data, error } = await client
        .from("waterings")
        .upsert({
          plant_name: plantName,
          category,
          default_interval_days: intervalDays,
          next_water_due_at: snoozed,
        })
        .select()
        .single();
      if (error) {
        setErrorMessage("Failed to snooze");
        return;
      }
      setRow((prev) => ({
        plant_name: data.plant_name,
        category: data.category ?? prev?.category ?? category,
        default_interval_days:
          data.default_interval_days ?? prev?.default_interval_days ?? intervalDays,
        last_watered_at: data.last_watered_at ?? prev?.last_watered_at ?? null,
        next_water_due_at: data.next_water_due_at ?? snoozed,
      }));
    });
  }

  const statusChipClass = isOverdue
    ? "bg-rose-100 text-rose-800"
    : row?.next_water_due_at
    ? "bg-emerald-100 text-emerald-800"
    : "bg-amber-100 text-amber-800";

  return (
    <div className="rounded-lg border border-neutral-200 p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-emerald-900">Watering</div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusChipClass}`}>
          {row?.next_water_due_at ? (isOverdue ? "overdue" : "scheduled") : "set schedule"}
        </span>
      </div>

      {supaAvailable ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[13px] text-neutral-800">
            <div>
              <span className="font-medium">Interval:</span> {intervalDays}d
            </div>
            <div>
              <span className="font-medium">Last:</span> {formatDate(row?.last_watered_at)}
            </div>
            <div className={isOverdue ? "text-rose-700 font-medium" : ""}>
              <span className="font-medium">Next:</span> {formatDate(row?.next_water_due_at)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Interval</label>
            <input
              type="number"
              min={1}
              className="w-20 px-2 py-1 border border-neutral-300 rounded-md"
              value={intervalDays}
              onChange={(e) => {
                const v = parseInt(e.target.value || "0", 10);
                setIntervalDays(Number.isFinite(v) && v > 0 ? v : 1);
              }}
              onBlur={() => saveInterval(intervalDays)}
            />
            <button
              onClick={markWatered}
              disabled={isPending}
              className="ml-auto bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-md disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Mark watered"}
            </button>
            <button
              onClick={snoozeTwoDays}
              className="text-xs px-3 py-1.5 rounded-md border border-neutral-300 hover:bg-neutral-50"
            >
              Snooze 2d
            </button>
          </div>

          {errorMessage ? (
            <div className="text-[12px] text-rose-700">{errorMessage}</div>
          ) : null}
        </div>
      ) : (
        <p className="text-[12px] text-neutral-600">
          Connect Supabase (set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to enable watering schedules.
        </p>
      )}
    </div>
  );
}


