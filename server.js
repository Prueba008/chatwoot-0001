require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const pino = require("pino");
const pinoPretty = require("pino-pretty");

const { verifyWebhook, verifyWidget } = require("./src/security");
const cache = require("./src/cache");
const { listProducts, updateVariantStock } = require("./src/tnClient");
const { sendMessage } = require("./src/cwClient");
const { buildProductReply, buildCatalogReply, pickProductByKeywords, normalize } = require("./src/templates");
const { startJobs, refreshProductsCache } = require("./src/jobs");

const log = pino(pinoPretty({ colorize: true }));

const app = express();
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.get("/health", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.get("/tiendanube-widget", verifyWidget, (req, res) => {
  res.sendFile(require("path").join(__dirname, "public", "widget.html"));
});

app.get("/api/products", verifyWidget, async (req, res) => {
  const q = (req.query.q || "").toString();
  const ck = q ? `products:q:${normalize(q)}` : "products:page1";

  let products = cache.get(ck);
  if (!products) {
    products = q
      ? await listProducts({ q, page: 1, per_page: 100 })
      : await listProducts({ page: 1, per_page: 100 });
    cache.set(ck, products);
  }

  const items = products.map(p => {
    const v = (p.variants && p.variants[0]) || {};
    return {
      id: p.id,
      name: p?.name?.es || "Producto",
      handle: p.handle,
      price: v.price ?? "N/D",
      stock: v.stock ?? 0,
      url: `${process.env.STORE_PUBLIC_URL}/productos/${p.handle}`,
      image: (p.images && p.images[0] && p.images[0].src) ? p.images[0].src.replace("http://", "https://") : "https://via.placeholder.com/80",
      variant: { id: v.id, sku: v.sku || null }
    };
  });

  res.json({ items });
});

const dedupe = new Map();
function isDup(id) {
  const t = dedupe.get(id);
  if (!t) return false;
  if (Date.now() > t) { dedupe.delete(id); return false; }
  return true;
}

app.post("/api/stock/adjust", verifyWidget, async (req, res) => {
  const { variant_id, delta, request_id } = req.body || {};
  if (!variant_id || !Number.isFinite(delta) || !request_id) return res.status(400).json({ error: "bad_request" });
  if (isDup(request_id)) return res.json({ ok: true, deduped: true });
  dedupe.set(request_id, Date.now() + 5 * 60 * 1000);

  let products = cache.get("products:page1");
  if (!products) products = await refreshProductsCache();

  let current = null;
  for (const p of products) {
    for (const v of (p.variants || [])) {
      if (Number(v.id) === Number(variant_id)) {
        current = Number(v.stock) || 0;
        break;
      }
    }
    if (current !== null) break;
  }
  if (current === null) return res.status(404).json({ error: "variant_not_found" });

  const new_stock = Math.max(0, current + Number(delta));
  await updateVariantStock({ variant_id, new_stock });
  cache.del("products:page1");

  res.json({ ok: true, variant_id, old_stock: current, new_stock, synced: true });
});

app.post("/api/stock/set", verifyWidget, async (req, res) => {
  const { variant_id, new_stock, request_id } = req.body || {};
  if (!variant_id || !Number.isFinite(new_stock) || !request_id) return res.status(400).json({ error: "bad_request" });
  if (isDup(request_id)) return res.json({ ok: true, deduped: true });
  dedupe.set(request_id, Date.now() + 5 * 60 * 1000);

  await updateVariantStock({ variant_id, new_stock: Math.max(0, Number(new_stock)) });
  cache.del("products:page1");

  res.json({ ok: true, variant_id, new_stock, synced: true });
});

app.post("/webhook", verifyWebhook, async (req, res) => {
  res.status(200).send("OK");

  try {
    const body = req.body || {};
    const event = body.event;
    const content = body.content || body?.message?.content || "";
    const messageType = body.message_type || body?.message?.message_type;
    const accountId = body?.account?.id;
    const conversationId = body?.conversation?.display_id;

    if (event !== "message_created") return;
    if (messageType !== "incoming") return;
    if (!accountId || !conversationId) return;

    const text = normalize(content);

    let products = cache.get("products:page1");
    if (!products) {
      products = await listProducts({ page: 1, per_page: 100 });
      cache.set("products:page1", products);
    }

    const wantsCatalog = ["catalogo", "catálogo", "lista", "productos"].some(k => text.includes(normalize(k)));
    const wantsStock = ["stock", "precio", "vale", "cuanto", "cuánto"].some(k => text.includes(normalize(k)));

    let reply = "¿Podés decirme el nombre del producto? Puedo darte precio, stock y link.";
    if (wantsCatalog) {
      reply = buildCatalogReply(products);
    } else if (wantsStock) {
      const p = pickProductByKeywords(products, content);
      reply = p ? buildProductReply(p) : "No pude identificar el producto. Decime el nombre exacto o una palabra clave.";
    }

    await sendMessage({ accountId, conversationId, content: reply, privateMsg: false });
    log.info({ conversationId, event }, "Bot reply sent");
  } catch (e) {
    log.error({ err: e?.response?.data || e.message }, "Webhook error");
  }
});

startJobs();

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  log.info(`✅ Bridge running on http://localhost:${PORT}`);
  log.info(`Health: http://localhost:${PORT}/health`);
  log.info(`Webhook: POST http://localhost:${PORT}/webhook`);
  log.info(`Widget:  http://localhost:${PORT}/tiendanube-widget?token=${process.env.WIDGET_TOKEN ? "****" : ""}`);
});
