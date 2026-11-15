export const mockDashboard = {
  positions: [
    { symbol: 'RELIANCE', status: 'HOLD', entry_price: 2842.5, current_price: 2891.2, pnl_percent: 1.71, opened_at: '2026-11-15T09:42:00' },
    { symbol: 'TCS', status: 'HOLD', entry_price: 4118, current_price: 4162.3, pnl_percent: 1.08, opened_at: '2026-11-15T10:16:00' },
    { symbol: 'INFY', status: 'FLAT', entry_price: 1498, current_price: 1512, pnl_percent: 0.93, opened_at: '2026-11-14T14:05:00' }
  ],
  signals: [
    { id: 1, symbol: 'RELIANCE', action: 'BUY', price: 2842.5, time: '2026-11-15T09:42:00', outcome: 'NEW_POSITION', notified: true },
    { id: 2, symbol: 'TCS', action: 'BUY', price: 4118, time: '2026-11-15T10:16:00', outcome: 'NEW_POSITION', notified: true },
    { id: 3, symbol: 'INFY', action: 'SELL', price: 1512, time: '2026-11-15T11:03:00', outcome: 'CLOSED', notified: true },
    { id: 4, symbol: 'RELIANCE', action: 'BUY', price: 2842.5, time: '2026-11-15T11:27:00', outcome: 'DUPLICATE', notified: false },
    { id: 5, symbol: 'HDFCBANK', action: 'BUY', price: 1764.8, time: '2026-11-14T13:22:00', outcome: 'NEW_POSITION', notified: true },
    { id: 6, symbol: 'HDFCBANK', action: 'SELL', price: 1781.4, time: '2026-11-14T15:08:00', outcome: 'CLOSED', notified: true }
  ]
}