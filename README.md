# Chatwoot + Tiendanube Bridge (Bot + Widget + Stock)

Incluye:
- Webhook `/webhook` para responder al cliente con precio/stock/link y catálogo (links)
- Widget embebible `/tiendanube-widget` (Dashboard App) con controles de ajuste de stock
- APIs JSON `/api/products`, `/api/stock/adjust`, `/api/stock/set`
- Jobs: refresh cache + low stock alerts a Chatwoot (mensajes privados)

## Requisitos
- Node 18+
- pnpm (o npm)

## Instalación
```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Configurar Chatwoot
### Webhook
- URL: `https://<tu-ngrok>/webhook`
- Header: `x-webhook-secret: <WEBHOOK_SECRET>`
- Evento: `message_created`

### Dashboard App
- URL: `https://<tu-ngrok>/tiendanube-widget?token=<WIDGET_TOKEN>`
- Tipo: Panel lateral

## Notas importantes
- El endpoint de actualización de stock en `src/tnClient.js` asume:
  `PUT /v1/{storeId}/variants/{variant_id}` con `{ stock: new_stock }`
  Si tu Tiendanube difiere, ajustá esa función con la ruta correcta.

Generado: 2026-01-26T02:51:27.068385Z
