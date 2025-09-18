/**
 * Push current sale rates from the local TV-display server to a remote webhook (e.g., your Vercel site).
 *
 * Usage:
 *   VERCEL_RATES_WEBHOOK_URL="https://www.devi-jewellers.com/api/rates/update" \
 *   LOCAL_BASE_URL="http://127.0.0.1:3000" \
 *   INTERVAL_SECONDS=30 \
 *   tsx scripts/push-rates.ts
 */

const WEBHOOK_URL = process.env.VERCEL_RATES_WEBHOOK_URL;
const LOCAL_BASE_URL = process.env.LOCAL_BASE_URL || "http://127.0.0.1:3000";
const INTERVAL_SECONDS = Number(process.env.INTERVAL_SECONDS || "30");

if (!WEBHOOK_URL) {
  console.error("VERCEL_RATES_WEBHOOK_URL is not set.");
  process.exit(1);
}

async function getSaleRates() {
  const res = await fetch(`${LOCAL_BASE_URL}/api/rates/sale`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load sale rates: ${res.status}`);
  return res.json();
}

async function postToWebhook(payload: any) {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Webhook failed: ${res.status} ${text}`);
  }
}

async function cycle() {
  try {
    const sale = await getSaleRates();
    if (!sale) {
      console.warn("No sale rates available yet.");
      return;
    }
    await postToWebhook({
      ...sale,
      source: "tv-display",
      pushed_at: new Date().toISOString(),
    });
    console.log(`[push-rates] Pushed at ${new Date().toLocaleString()} → ${WEBHOOK_URL}`);
  } catch (err: any) {
    console.error("[push-rates] Error:", err?.message || err);
  }
}

console.log(`[push-rates] Starting. Interval: ${INTERVAL_SECONDS}s, Local: ${LOCAL_BASE_URL}, Webhook: ${WEBHOOK_URL}`);
cycle();
setInterval(cycle, INTERVAL_SECONDS * 1000);