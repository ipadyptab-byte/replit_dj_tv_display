import { useEffect, useMemo, useState } from "react";
import { ratesApi } from "@/lib/api";

type SaleRates = {
  gold_24k_sale: number | null;
  gold_22k_sale: number | null;
  gold_18k_sale: number | null;
  silver_per_kg_sale: number | null;
  updated_at?: string | null;
};

export default function SaleStatus() {
  const [rates, setRates] = useState<SaleRates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch and refresh every 30s
  const fetchRates = async () => {
    try {
      setError(null);
      const data = await ratesApi.getCurrent();
      if (!data) {
        setRates(null);
        return;
      }
      const saleOnly: SaleRates = {
        gold_24k_sale: data.gold_24k_sale ?? null,
        gold_22k_sale: data.gold_22k_sale ?? null,
        gold_18k_sale: data.gold_18k_sale ?? null,
        silver_per_kg_sale: data.silver_per_kg_sale ?? null,
        updated_at: data.created_date ?? null,
      };
      setRates(saleOnly);
    } catch (e: any) {
      setError(e?.message || "Failed to load rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const id = setInterval(fetchRates, 30_000);
    return () => clearInterval(id);
  }, []);

  // Allow ?format=json to easily consume by other clients if needed
  const isJsonFormat = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return (params.get("format") || "").toLowerCase() === "json";
  }, []);

  if (isJsonFormat) {
    // Render a minimal, machine-friendly JSON
    return (
      <pre style={{ margin: 0, padding: 12, background: "#000", color: "#0f0" }}>
        {JSON.stringify(
          {
            status: error ? "error" : rates ? "ok" : loading ? "loading" : "no-data",
            data: rates,
            error: error || null,
          },
          null,
          2
        )}
      </pre>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8E1", color: "#212529", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 720 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
          Current Sale Rates
        </h1>

        {loading && <p style={{ textAlign: "center" }}>Loading...</p>}
        {error && <p style={{ textAlign: "center", color: "#b00020" }}>{error}</p>}
        {!loading && !error && !rates && <p style={{ textAlign: "center" }}>No rate data available</p>}

        {rates && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <RateCard label="Gold 24K (10g)" value={rates.gold_24k_sale} />
            <RateCard label="Gold 22K (10g)" value={rates.gold_22k_sale} />
            <RateCard label="Gold 18K (10g)" value={rates.gold_18k_sale} />
            <RateCard label="Silver (1kg)" value={rates.silver_per_kg_sale} />
          </div>
        )}

        {rates?.updated_at && (
          <p style={{ marginTop: 16, fontSize: 12, textAlign: "center", opacity: 0.7 }}>
            Last updated: {new Date(rates.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        )}
      </div>
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div style={{
      background: "#ffffff",
      borderLeft: "6px solid #1565C0",
      borderRadius: 10,
      padding: 16,
      boxShadow: "0 1px 6px rgba(0,0,0,0.08)"
    }}>
      <p style={{ fontSize: 14, marginBottom: 6, color: "#4a5568" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: "#1e3a8a" }}>
        {typeof value === "number" ? `₹${value}` : "—"}
      </p>
    </div>
  );
}