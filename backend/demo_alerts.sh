#!/usr/bin/env bash
# Fake TradingView alerts for local testing / client demo.
# Usage: ./demo_alerts.sh [base_url] [secret]
BASE="${1:-http://localhost:8000}"
SECRET="${2:-change-me-to-a-long-random-string}"

post() {
  echo "--> $1"
  curl -s -X POST "$BASE/webhook/tradingview" \
    -H "Content-Type: application/json" \
    -d "{\"secret\":\"$SECRET\",\"symbol\":\"$2\",\"action\":\"$3\",\"price\":$4,\"strategy\":\"EMA Cross\"}"
  echo; sleep 1
}

post "BUY RELIANCE"            RELIANCE BUY  2900
post "duplicate BUY (ignored)" RELIANCE BUY  2905
post "BUY TCS"                 TCS      BUY  4100
post "SELL RELIANCE (profit)"  RELIANCE SELL 2975
post "SELL INFY (nothing held)" INFY    SELL 1500

echo "--> wrong secret (expect 401)"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/webhook/tradingview" \
  -H "Content-Type: application/json" \
  -d '{"secret":"nope","symbol":"TCS","action":"BUY","price":1}'

echo "--> hold summary"
curl -s -X POST "$BASE/api/summary" -H "X-Webhook-Secret: $SECRET"; echo
