# Chatwoot + Tiendanube (Nativo) - Kit de Proyecto para Visual Studio / VS Code (WSL2)

Este repo **NO incluye Chatwoot completo** (es grande). Es un **kit** para:
- clonar Chatwoot (upstream),
- levantar entorno DEV (Postgres + Redis),
- aplicar un **patch nativo Rails** que agrega:
  - Webhooks Tiendanube (orders/customers) dentro de Chatwoot
  - Endpoint interno autenticado para el dashboard: `/api/v1/integrations/tiendanube/products`
  - Cliente Ruby para Tiendanube con headers correctos (`Authentication: bearer ...`)

> Recomendación: usar **WSL2 + Ubuntu 22.04** y abrir el proyecto con **VS Code Remote - WSL** o Visual Studio con soporte WSL.

---

## 1) Requisitos en Windows

- WSL2 + Ubuntu 22.04
- Docker Desktop (con integración WSL activada)
- Git
- VS Code (recomendado) o Visual Studio 2022

---

## 2) Preparar WSL2 (Ubuntu 22.04)

En PowerShell (admin):

```powershell
wsl --install -d Ubuntu-22.04
```

En Ubuntu:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

---

## 3) Clonar Chatwoot (upstream)

En Ubuntu:

```bash
mkdir -p ~/dev && cd ~/dev
git clone https://github.com/chatwoot/chatwoot.git
cd chatwoot
git checkout stable
```

---

## 4) Levantar dependencias (Postgres + Redis) para DEV

Este repo trae un `docker-compose.dev.yml` listo. Copialo dentro del repo Chatwoot:

```bash
cp -f ../chatwoot_tiendanube_native_vs/docker-compose.dev.yml ./docker-compose.dev.yml
docker compose -f docker-compose.dev.yml up -d
```

Verificá:

```bash
docker ps
```

---

## 5) Configurar variables (.env) para DEV

En el repo Chatwoot:

```bash
cp -n .env.example .env || true
```

Luego agregá (o exportá) las variables Tiendanube:

```bash
cat >> .env <<'EOF'

# --- Tiendanube Integration ---
TIENDANUBE_STORE_ID=7208693
TIENDANUBE_ACCESS_TOKEN=REEMPLAZAR_POR_TOKEN
TIENDANUBE_USER_AGENT=app-chatwoot (tu-email@dominio.com)
EOF
```

> No hardcodear tokens en código.

---

## 6) Aplicar el patch nativo (Rails)

Desde este repo (kit), corré:

```bash
cd ~/dev/chatwoot_tiendanube_native_vs
bash scripts/apply_patch.sh ~/dev/chatwoot
```

Esto copia archivos a:
- `app/services/tiendanube/*`
- `app/controllers/api/v1/integrations/tiendanube/*`
- `app/controllers/webhooks/tiendanube/*`
- agrega un snippet de routes en `docs/routes_snippet.rb`

Luego **vos** pegás el snippet en `config/routes.rb` (sección indicada).

---

## 7) Correr Chatwoot en DEV

Dentro del repo Chatwoot:

```bash
# Instalar deps (puede tardar)
bundle install
pnpm install

# Crear DB + migraciones
RAILS_ENV=development bundle exec rails db:setup

# Levantar server
foreman start -f Procfile.dev
```

Abrir:
- http://localhost:3000

---

## 8) Probar el endpoint Tiendanube (con sesión dashboard)

Una vez logueado en Chatwoot, en el browser:

- `GET /api/v1/integrations/tiendanube/products`

Opcional: query params:
- `?page=1&per_page=20&q=remera`

---

## 9) Probar webhooks (manual)

Ejecutar (desde WSL) con tu dominio/localtunnel/ngrok:

```bash
curl -X POST http://localhost:3000/webhooks/tiendanube/7208693/orders \
  -H "Content-Type: application/json" \
  -d @samples/tiendanube_order_created.json
```

Ver logs del server.

---

## 10) Archivos incluidos

- `patch/` Código Rails a copiar dentro de Chatwoot.
- `samples/` Payloads de prueba.
- `postman/` Colección Postman para testear endpoints.
- `docker-compose.dev.yml` Postgres + Redis.

---

## Notas de Producción

- En prod, NO uses `localhost`, usa dominio HTTPS.
- Para webhooks externos, exponer Chatwoot con Nginx + SSL.
- Rotá el token si ya lo publicaste en chats o repos.

# STATUS

•	✅ Token de API validado: Funciona correctamente.
•	✅ Estructura de tienda: Confirmada (existen datos).
•	✅ Procedimiento de widget: Claro y validado.
•	✅ Geracion de código inicia.
•	⏳ Pendiente: Ejecutar script de discovery.
•	⏳ Pendiente  : Instalar ide VS
•	⏳ Pendiente  : Instalar proyectoMVP 1.0
•	⏳ Pendiente  : Compilar código.
•	⏳ Pendiente  : Despliegue y pruebas
