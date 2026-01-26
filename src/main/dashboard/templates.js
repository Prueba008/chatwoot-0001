function normalize(s = "") {
  return String(s).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function buildProductReply(p) {
  const v = p?.variants?.[0] || {};
  const name = p?.name?.es || "Producto";
  const price = v.price ?? "N/D";
  const stock = v.stock ?? 0;
  const url = `${process.env.STORE_PUBLIC_URL}/productos/${p.handle}`;
  return `🎯 *${name}*\n💰 Precio: $${price}\n📦 Stock: ${stock}\n🔗 ${url}`;
}

function buildCatalogReply(products) {
  const lines = products.slice(0, 8).map((p, i) => {
    const name = p?.name?.es || "Producto";
    const url = `${process.env.STORE_PUBLIC_URL}/productos/${p.handle}`;
    return `${i + 1}) ${name}\n${url}`;
  });
  return `📦 *Catálogo (selección)*\n\n${lines.join("\n\n")}\n\n¿Querés que te pase precio/stock de alguno?`;
}

function pickProductByKeywords(products, query) {
  const q = normalize(query);
  const tokens = q.split(/\s+/).filter(t => t.length > 3);

  let best = null;
  let bestScore = 0;
  for (const p of products) {
    const name = normalize(p?.name?.es || "");
    let score = 0;
    for (const t of tokens) if (name.includes(t)) score++;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore > 0 ? best : null;
}

module.exports = { normalize, buildProductReply, buildCatalogReply, pickProductByKeywords };
