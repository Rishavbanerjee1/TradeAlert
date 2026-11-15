# TradeAlert Frontend

A React + Vite dashboard for the Phase 1 TradingView → FastAPI → Telegram signal-notification product.

## 1. Requirements
- Node.js 18+ (Node 20 LTS recommended)
- Your FastAPI backend running locally on port 8000

## 2. Run locally
Open a terminal in this folder:

```bash
npm install
```

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

Start the frontend:

```bash
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173).

## 3. Connect to your backend
`.env` should contain:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Restart `npm run dev` after changing `.env`.

The dashboard calls:
- `GET /api/signals`
- `GET /api/positions`
- `GET /api/summary` (optional)

If the backend is unavailable, it shows clearly labelled sample data. Use the **Test connection** button on Settings or the refresh icon to retry.

## 4. Backend integration notes
The API adapter accepts either a JSON array or an object containing one of `items`, `results`, `signals`, `positions`, or `data`.

Signal fields recognised:
- `id` / `signal_id`
- `symbol` / `ticker`
- `action` / `signal` / `side`
- `price` / `close` / `entry_price`
- `time` / `timestamp` / `created_at` / `signal_time`
- `outcome` / `status` / `result`
- `notified` / `notification_sent`

Position fields recognised:
- `symbol` / `ticker`
- `status` / `state`
- `entry_price` / `average_price` / `price`
- `current_price` / `last_price` / `ltp`
- `pnl_percent` / `profit_percent` / `change_percent`
- `opened_at` / `entry_time` / `created_at`

If your backend returns different names, update `src/api.js` / the normalisers in `src/App.jsx` to match its actual response. Do not guess the API schema—check FastAPI `/docs` or `/openapi.json`.

## 5. CORS
If the browser reports a CORS error, add the Vite origin to FastAPI's CORS allow-list:

```python
allow_origins=["http://localhost:5173"]
```

Do not use `allow_origins=["*"]` with credentials in a real deployment.

## 6. Security
- Do not put `WEBHOOK_SECRET`, Telegram bot tokens, chat IDs, or database credentials in frontend files.
- The frontend is a monitoring dashboard. It does not execute broker orders.
- Keep the webhook secret check on the backend.
- Before client production use, add authentication and per-user authorisation to the backend and protect the dashboard routes.

## 7. Build
```bash
npm run build
```
The production output is created in `dist/`.
