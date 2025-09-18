import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ratesApi } from "@/lib/api";

export default function SaleStatus() {
  const { data: currentRates, isLoading, isError } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-xl font-semibold text-gray-700">Loading…</p>
      </div>
    );
  }

  if (isError || !currentRates) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-xl font-semibold text-red-600">Rates unavailable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-gray-900">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Today’s Sale Rates</h1>

        <div className="space-y-3 text-lg">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-medium">Gold 24K (per 10g)</span>
            <span id="gold_24k_sale" className="font-bold">₹{currentRates.gold_24k_sale}</span>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-medium">Gold 22K (per 10g)</span>
            <span id="gold_22k_sale" className="font-bold">₹{currentRates.gold_22k_sale}</span>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-medium">Gold 18K (per 10g)</span>
            <span id="gold_18k_sale" className="font-bold">₹{currentRates.gold_18k_sale}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Silver (per kg)</span>
            <span id="silver_per_kg_sale" className="font-bold">₹{currentRates.silver_per_kg_sale}</span>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Auto-refreshes every 30 seconds. Only sale rates are shown on this page.
        </p>
      </div>
    </div>
  );
}