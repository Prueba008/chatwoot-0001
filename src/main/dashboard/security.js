function verifyWebhook(req, res, next) {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return next();
  const got = req.header("x-webhook-secret");
  if (got !== expected) return res.status(401).send("Unauthorized");
  next();
}

function verifyWidget(req, res, next) {
  const expected = process.env.WIDGET_TOKEN;
  if (!expected) return next();
  const got = req.query.token || req.header("x-widget-token");
  if (got !== expected) return res.status(401).send("Unauthorized");
  next();
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

module.exports = { verifyWebhook, verifyWidget, escapeHtml };
