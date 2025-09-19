import React, { useEffect, useMemo, useState } from "react";
import { BsGraphUpArrow } from "react-icons/bs";
import { ratesApi } from "@/lib/api";
import type { GoldRate } from "@shared/schema";

type UiRates = {
  vedhani?: number | null;
  ornaments22K?: number | null;
  ornaments18K?: number | null;
  silver?: number | null;
};

const formatINR = (value?: number | null) => {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const CurrentRates: React.FC = () => {
  const [apiRates, setApiRates] = useState<GoldRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchRates = async () => {
      try {
        setLoading(true);
        const data = await ratesApi.getCurrent();
        if (!cancelled) {
          setApiRates(data);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load rates");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRates();

    // Optional: refresh periodically using server-provided setting later if needed
    const interval = setInterval(fetchRates, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Map backend fields to the UI fields you previously had in Firebase
  const uiRates: UiRates = useMemo(() => {
    if (!apiRates) return {};
    return {
      vedhani: apiRates.gold_24k_sale ?? null,       // Adjust if your definition differs
      ornaments22K: apiRates.gold_22k_sale ?? null,
      ornaments18K: apiRates.gold_18k_sale ?? null,
      silver: apiRates.silver_per_kg_sale ?? null,   // If you want per-gram, divide by 1000
    };
  }, [apiRates]);

  return (
    <div className="relative inline-flex flex-col items-start">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <BsGraphUpArrow />
        </span>
        <span className="text-base font-semibold">Current Rates</span>
      </div>

      <div className="mt-3 rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Today's Gold Rates</h2>
        {loading && <div className="text-sm text-neutral-500">Loading…</div>}
        {error && !loading && (
          <div className="text-sm text-red-600">Error: {error}</div>
        )}
        {!loading && !error && (
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>Vedhani</span>
              <span className="font-medium">{formatINR(uiRates.vedhani)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>22KT</span>
              <span className="font-medium">
                {formatINR(uiRates.ornaments22K)}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>18KT</span>
              <span className="font-medium">
                {formatINR(uiRates.ornaments18K)}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Silver</span>
              <span className="font-medium">{formatINR(uiRates.silver)}</span>
            </li>
          </ul>
        )}
        {apiRates?.created_date && (
          <div className="mt-3 text-xs text-neutral-500">
            Updated: {new Date(apiRates.created_date as any).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentRates;