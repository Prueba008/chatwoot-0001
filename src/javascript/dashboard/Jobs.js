const cache = require("./cache");
const { listProducts } = require("./tnClient");
const { sendMessage } = require("./cwClient");

async function refreshProductsCache() {
  const products = await listProducts({ page: 1, per_page: 100 });
  cache.set("products:page1", products);
  return products;
}

async function lowStockAlertCheck() {
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 3);

  let products = cache.get("products:page1");
  if (!products) products = await refreshProductsCache();

  const low = [];
  for (const p of products) {
    const variants = p.variants || [];
    const total = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    if (total <= threshold) {
      low.push({ name: p?.name?.es || "Producto", total, handle: p.handle });
    }
  }

  if (low.length === 0) return;

  const text =
    `⚠️ *Alerta de Bajo Stock* (<= ${threshold})\n\n` +
    low.slice(0, 15).map(x =>
      `- ${x.name}: ${x.total}\n  ${process.env.STORE_PUBLIC_URL}/productos/${x.handle}`
    ).join("\n");

  await sendMessage({
    accountId: Number(process.env.CW_ACCOUNT_ID),
    conversationId: Number(process.env.ALERT_CHATWOOT_CONVERSATION_ID),
    content: text,
    privateMsg: true
  });
}

function startJobs() {
  const refreshMs = Number(process.env.SYNC_REFRESH_MS || 600000);

  setInterval(() => {
    refreshProductsCache().catch(() => {});
  }, refreshMs);

  setInterval(() => {
    lowStockAlertCheck().catch(() => {});
  }, refreshMs);
}

module.exports = { startJobs, refreshProductsCache, lowStockAlertCheck };
