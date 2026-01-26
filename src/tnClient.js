const axios = require("axios");

function tnHeaders() {
  return {
    Authentication: `bearer ${process.env.TN_TOKEN}`,
    "User-Agent": process.env.TN_USER_AGENT,
  };
}

async function listProducts({ page = 1, per_page = 100, q } = {}) {
  const url = `${process.env.TN_API_BASE}/${process.env.TN_STORE_ID}/products`;
  const r = await axios.get(url, {
    headers: tnHeaders(),
    params: { page, per_page, ...(q ? { q } : {}) },
    timeout: 10000,
  });
  return r.data || [];
}

/**
 * Ajuste de stock por variant_id.
 * IMPORTANTE: Confirmar endpoint real de Tiendanube para update de variant.
 * Este ejemplo asume:
 *   PUT /v1/{storeId}/variants/{variant_id}  { stock: new_stock }
 */
async function updateVariantStock({ variant_id, new_stock }) {
  const url = `${process.env.TN_API_BASE}/${process.env.TN_STORE_ID}/variants/${variant_id}`;
  const r = await axios.put(
    url,
    { stock: new_stock },
    { headers: tnHeaders(), timeout: 10000 }
  );
  return r.data;
}

module.exports = { listProducts, updateVariantStock };
