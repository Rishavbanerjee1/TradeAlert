import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, ChartNoAxesCombined,
  ChevronDown, CircleHelp, Clock3, Command, ExternalLink, LayoutDashboard,
  LifeBuoy, ListFilter, Menu, MoreHorizontal, Radio, RefreshCw, Search,
  Settings2, ShieldCheck, SlidersHorizontal, TrendingUp, WalletCards,
  X, Zap
} from 'lucide-react'
import { fetchDashboard, BASE_URL } from './api'
import { mockDashboard } from './mockData'

const money = value => value == null || Number.isNaN(Number(value))
  ? '—'
  : `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function pick(obj, keys, fallback = undefined) {
  for (const key of keys) if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key]
  return fallback
}

function normalizeSignal(s, i) {
  return {
    id: pick(s, ['id', 'signal_id'], i + 1),
    symbol: String(pick(s, ['symbol', 'ticker'], 'UNKNOWN')).toUpperCase(),
    action: String(pick(s, ['action', 'signal', 'side'], '—')).toUpperCase(),
    price: pick(s, ['price', 'close', 'entry_price']),
    time: pick(s, ['time', 'timestamp', 'created_at', 'signal_time']),
    outcome: String(pick(s, ['outcome', 'status', 'result'], 'RECEIVED')).toUpperCase(),
    notified: pick(s, ['notified', 'notification_sent'], null)
  }
}

function normalizePosition(p) {
  return {
    symbol: String(pick(p, ['symbol', 'ticker'], 'UNKNOWN')).toUpperCase(),
    status: String(pick(p, ['status', 'state'], 'HOLD')).toUpperCase(),
    entry: pick(p, ['entry_price', 'average_price', 'price']),
    current: pick(p, ['current_price', 'last_price', 'ltp']),
    pnl: pick(p, ['pnl_percent', 'profit_percent', 'change_percent']),
    opened: pick(p, ['opened_at', 'entry_time', 'created_at'])
  }
}

function formatTime(value) {
  if (!value) return 'Time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Badge({ children, kind = 'neutral' }) {
  return <span className={`badge badge-${kind}`}>{children}</span>
}

function StatCard({ label, value, detail, icon: Icon, tone = 'blue' }) {
  return <div className="stat-card">
    <div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={17} /></span></div>
    <div className="stat-value">{value}</div>
    <div className="stat-detail">{detail}</div>
  </div>
}

function App() {
  const [active, setActive] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [data, setData] = useState(mockDashboard)
  const [mode, setMode] = useState('demo')
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [notice, setNotice] = useState('')

  async function refresh() {
    setLoading(true)
    try {
      const live = await fetchDashboard()
      setData(live)
      setMode('live')
      setNotice('')
    } catch (error) {
      setMode('demo')
      setData(mockDashboard)
      setNotice('Backend not connected — showing sample data. Start FastAPI and check the API URL to switch to live data.')
    } finally {
      setLastUpdated(new Date())
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const signals = useMemo(() => (data.signals || []).map(normalizeSignal), [data])
  const positions = useMemo(() => (data.positions || []).map(normalizePosition), [data])
  const holding = positions.filter(p => p.status === 'HOLD' || p.status === 'OPEN')
  const buyCount = signals.filter(s => s.action === 'BUY').length
  const sellCount = signals.filter(s => s.action === 'SELL').length
  const notifiedCount = signals.filter(s => s.notified === true).length
  const visibleSignals = signals.filter(s => {
    const matchesSearch = `${s.symbol} ${s.action} ${s.outcome}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (filter === 'ALL' || s.action === filter)
  })

  const nav = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Signals', icon: Radio, count: signals.length },
    { label: 'Positions', icon: WalletCards, count: holding.length },
    { label: 'Strategies', icon: ChartNoAxesCombined },
    { label: 'Settings', icon: Settings2 }
  ]

  function go(label) {
    setActive(label)
    setMobileOpen(false)
  }

  return <div className="app-shell">
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><TrendingUp size={21} strokeWidth={2.6} /></div>
        <div><div className="brand-name">trade<span>alert</span></div><div className="brand-caption">SIGNAL INTELLIGENCE</div></div>
        <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="workspace-switch"><div className="workspace-avatar">TD</div><div className="workspace-copy"><b>Trading Desk</b><span>Personal workspace</span></div><ChevronDown size={15} /></div>
      <div className="nav-label">MENU</div>
      <nav className="nav-list">
        {nav.map(({ label, icon: Icon, count }) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => go(label)}>
          <Icon size={18} /><span>{label}</span>{count !== undefined && <small>{count}</small>}
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card">
          <div className="upgrade-icon"><Zap size={16} /></div>
          <b>Stay ahead of the market</b>
          <p>Connect your strategy alerts to keep your trading desk in sync.</p>
          <button onClick={() => go('Settings')}>Configure alerts <ArrowUpRight size={14} /></button>
        </div>
        <div className="profile">
          <div className="profile-avatar">R</div><div className="profile-copy"><b>Demo User</b><span>Workspace admin</span></div><MoreHorizontal size={19} />
        </div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="top-left">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb">Workspace <span>/</span> <b>{active}</b></div>
        </div>
        <div className="top-actions">
          <div className={`connection-pill ${mode}`}><span className="connection-dot" />{mode === 'live' ? 'Live API connected' : 'Demo mode'}</div>
          <button className="icon-button" title="Refresh data" onClick={refresh}><RefreshCw size={17} className={loading ? 'spin' : ''} /></button>
          <button className="icon-button notification-button" title="Notifications"><Bell size={18} /><i /></button>
          <div className="top-avatar">R</div>
        </div>
      </header>

      <div className="page-content">
        {notice && <div className="notice"><Activity size={16} /><span>{notice}</span><button onClick={() => setNotice('')}><X size={15} /></button></div>}
        {active === 'Overview' && <Overview
          signals={signals} positions={positions} holding={holding} buyCount={buyCount}
          sellCount={sellCount} notifiedCount={notifiedCount} mode={mode}
          lastUpdated={lastUpdated} onNavigate={go} />
        }
        {active === 'Signals' && <SignalsPage signals={visibleSignals} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />}
        {active === 'Positions' && <PositionsPage positions={positions} />}
        {active === 'Strategies' && <StrategiesPage onNavigate={go} />}
        {active === 'Settings' && <SettingsPage mode={mode} baseUrl={BASE_URL} onRefresh={refresh} loading={loading} />}
      </div>
      <footer className="footer"><span>TradeAlert <span className="footer-dot">•</span> Phase 1 preview</span><span>Last synced {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} <span className="footer-dot">•</span> <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API docs <ExternalLink size={11} /></a></span></footer>
    </main>
  </div>
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>
}

function Overview({ signals, positions, holding, buyCount, sellCount, notifiedCount, mode, lastUpdated, onNavigate }) {
  const recent = signals.slice(0, 5)
  const pnl = holding.reduce((sum, p) => sum + (Number(p.pnl) || 0), 0)
  return <>
    <PageHeading eyebrow="SUNDAY, 15 NOVEMBER 2026" title="Good afternoon, Rishav" subtitle="Here’s what’s happening with your trading strategies today."
      action={<button className="button-primary" onClick={() => onNavigate('Signals')}><Activity size={16} /> View all signals</button>} />
    <div className="overview-meta"><span className="market-indicator"><span /> Market monitor</span><span>Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span><Badge kind={mode === 'live' ? 'green' : 'amber'}>{mode === 'live' ? 'LIVE DATA' : 'SAMPLE DATA'}</Badge></div>
    <div className="stats-grid">
      <StatCard label="Active positions" value={holding.length.toString().padStart(2, '0')} detail="Currently marked as HOLD" icon={WalletCards} tone="blue" />
      <StatCard label="Signals received" value={signals.length.toString().padStart(2, '0')} detail={`${buyCount} buy · ${sellCount} sell signals`} icon={Radio} tone="purple" />
      <StatCard label="Notifications sent" value={notifiedCount.toString().padStart(2, '0')} detail="Successfully marked as notified" icon={Bell} tone="green" />
      <StatCard label="Open position P&L" value={`${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`} detail="Illustrative aggregate of open positions" icon={TrendingUp} tone="orange" />
    </div>

    <div className="content-grid">
      <section className="panel positions-panel">
        <div className="panel-heading"><div><h2>Current positions</h2><p>Positions tracked from incoming strategy signals</p></div><button className="text-button" onClick={() => onNavigate('Positions')}>View positions <ArrowUpRight size={14} /></button></div>
        {holding.length ? <div className="table-wrap"><table><thead><tr><th>ASSET</th><th>ENTRY PRICE</th><th>LAST PRICE</th><th>CHANGE</th><th>STATUS</th></tr></thead><tbody>
          {holding.slice(0, 5).map(p => <tr key={p.symbol}><td><div className="asset-cell"><div className="asset-icon">{p.symbol.slice(0, 1)}</div><div><b>{p.symbol}</b><small>NSE · Equity</small></div></div></td><td>{money(p.entry)}</td><td>{money(p.current)}</td><td><span className={Number(p.pnl) >= 0 ? 'positive' : 'negative'}>{p.pnl == null ? '—' : `${Number(p.pnl) >= 0 ? '+' : ''}${Number(p.pnl).toFixed(2)}%`}</span></td><td><Badge kind="green">● HOLD</Badge></td></tr>)}
        </tbody></table></div> : <EmptyState title="No open positions" body="A BUY signal will appear here when a strategy opens a position." />}
      </section>
      <section className="panel signal-panel">
        <div className="panel-heading"><div><h2>Signal activity</h2><p>Latest updates from your strategies</p></div><button className="icon-button subtle"><MoreHorizontal size={19} /></button></div>
        <div className="activity-list">{recent.map((s, i) => <div className="activity-row" key={s.id}><div className={`activity-symbol ${s.action.toLowerCase()}`}>{s.action === 'BUY' ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</div><div className="activity-main"><b>{s.action} <span>{s.symbol}</span></b><small>{formatTime(s.time)}</small></div><div className="activity-side"><b>{money(s.price)}</b><small>{s.outcome.replaceAll('_', ' ')}</small></div></div>)}
          {!recent.length && <EmptyState title="No signals yet" body="Incoming TradingView alerts will be listed here." />}
        </div>
        <button className="panel-bottom-link" onClick={() => onNavigate('Signals')}>Explore signal history <ArrowUpRight size={14} /></button>
      </section>
    </div>

    <div className="bottom-grid">
      <section className="panel integration-panel"><div className="integration-icon"><Radio size={19} /></div><div className="integration-copy"><h2>TradingView connection</h2><p>Your webhook endpoint is ready to receive strategy alerts.</p><code>POST /webhook/tradingview</code></div><Badge kind="blue">PHASE 1</Badge></section>
      <section className="panel security-panel"><div className="security-icon"><ShieldCheck size={19} /></div><div><h2>Signal-only mode</h2><p>TradeAlert sends notifications. It does not place broker orders.</p></div><Badge kind="green">ENABLED</Badge></section>
    </div>
  </>
}

function EmptyState({ title, body }) {
  return <div className="empty-state"><div className="empty-icon"><Activity size={20} /></div><b>{title}</b><p>{body}</p></div>
}

function SignalsPage({ signals, search, setSearch, filter, setFilter }) {
  return <>
    <PageHeading eyebrow="ACTIVITY LOG" title="Signal history" subtitle="Every incoming TradingView alert, its processing result, and notification status." />
    <section className="panel full-panel">
      <div className="toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbol or action..." /></div><div className="filter-wrap"><ListFilter size={15} /><select value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">All actions</option><option value="BUY">Buy</option><option value="SELL">Sell</option></select></div></div>
      <div className="table-wrap"><table><thead><tr><th>SYMBOL</th><th>ACTION</th><th>PRICE</th><th>RECEIVED AT</th><th>PROCESSING</th><th>NOTIFICATION</th></tr></thead><tbody>
        {signals.map(s => <tr key={s.id}><td><b>{s.symbol}</b></td><td><Badge kind={s.action === 'BUY' ? 'green' : 'red'}>{s.action}</Badge></td><td>{money(s.price)}</td><td>{formatTime(s.time)}</td><td><Badge kind={s.outcome === 'NEW_POSITION' || s.outcome === 'CLOSED' ? 'blue' : 'neutral'}>{s.outcome.replaceAll('_', ' ')}</Badge></td><td>{s.notified === true ? <span className="notification-status sent">● Sent</span> : s.notified === false ? <span className="notification-status muted">● Not sent</span> : <span className="muted-text">Unknown</span>}</td></tr>)}
      </tbody></table>{!signals.length && <EmptyState title="No matching signals" body="Try a different search or filter." />}</div>
    </section>
  </>
}

function PositionsPage({ positions }) {
  return <>
    <PageHeading eyebrow="PORTFOLIO MONITOR" title="Positions" subtitle="A simple view of the position state inferred from BUY and SELL signals." />
    <section className="panel full-panel"><div className="panel-heading"><div><h2>Tracked assets</h2><p>HOLD means a BUY has been received and no matching SELL has closed it.</p></div><Badge kind="blue">{positions.length} TRACKED</Badge></div>
      <div className="table-wrap"><table><thead><tr><th>SYMBOL</th><th>STATE</th><th>ENTRY PRICE</th><th>LAST PRICE</th><th>P&L</th><th>OPENED</th></tr></thead><tbody>
        {positions.map(p => <tr key={p.symbol}><td><b>{p.symbol}</b></td><td><Badge kind={p.status === 'HOLD' || p.status === 'OPEN' ? 'green' : 'neutral'}>{p.status}</Badge></td><td>{money(p.entry)}</td><td>{money(p.current)}</td><td className={Number(p.pnl) >= 0 ? 'positive' : 'negative'}>{p.pnl == null ? '—' : `${Number(p.pnl) >= 0 ? '+' : ''}${Number(p.pnl).toFixed(2)}%`}</td><td>{formatTime(p.opened)}</td></tr>)}
      </tbody></table>{!positions.length && <EmptyState title="Nothing tracked yet" body="A new BUY alert will create a tracked position." />}</div>
    </section>
    <p className="disclaimer">Position prices and P&L are only displayed when supplied by the backend. TradeAlert does not independently fetch live market prices in Phase 1.</p>
  </>
}

function StrategiesPage({ onNavigate }) {
  return <>
    <PageHeading eyebrow="STRATEGY SOURCES" title="Strategies" subtitle="Manage the TradingView strategies that send alerts to this workspace." />
    <div className="strategy-placeholder panel"><div className="placeholder-art"><ChartNoAxesCombined size={28} /></div><h2>Strategy management is coming next</h2><p>Phase 1 receives alerts from TradingView. Strategy registration, per-strategy performance, and multiple client workspaces can be added in a later phase.</p><div className="endpoint-box"><span>YOUR WEBHOOK ENDPOINT</span><code>POST /webhook/tradingview</code></div><button className="button-primary" onClick={() => onNavigate('Settings')}><Settings2 size={16} /> View connection settings</button></div>
  </>
}

function SettingsPage({ mode, baseUrl, onRefresh, loading }) {
  return <>
    <PageHeading eyebrow="WORKSPACE CONFIGURATION" title="Settings" subtitle="Connection details for the Phase 1 signal notification demo." />
    <div className="settings-grid">
      <section className="panel settings-card"><div className="settings-title"><div className="settings-icon"><Radio size={18} /></div><div><h2>Backend connection</h2><p>FastAPI service status</p></div><Badge kind={mode === 'live' ? 'green' : 'amber'}>{mode === 'live' ? 'CONNECTED' : 'DEMO MODE'}</Badge></div>
        <div className="setting-row"><div><b>API base URL</b><small>Configured in your frontend .env file</small></div><code>{baseUrl}</code></div>
        <div className="setting-row"><div><b>Signals endpoint</b><small>Loads recent alert history</small></div><code>GET /api/signals</code></div>
        <div className="setting-row"><div><b>Positions endpoint</b><small>Loads current HOLD / FLAT state</small></div><code>GET /api/positions</code></div>
        <div className="setting-row"><div><b>Summary endpoint</b><small>Optional dashboard summary</small></div><code>GET /api/summary</code></div>
        <button className="button-primary settings-refresh" onClick={onRefresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Test connection</button>
      </section>
      <section className="panel settings-card"><div className="settings-title"><div className="settings-icon telegram"><Bell size={18} /></div><div><h2>Telegram notifications</h2><p>Delivery is controlled by the backend</p></div><Badge kind="blue">BACKEND</Badge></div>
        <div className="info-box"><ShieldCheck size={17} /><span>Bot token and chat ID should stay in the backend environment variables. Never put them in frontend code.</span></div>
        <div className="setting-row"><div><b>Delivery channel</b><small>Phase 1 notification channel</small></div><span className="plain-value">Telegram</span></div>
        <div className="setting-row"><div><b>WhatsApp</b><small>Planned for a later phase</small></div><Badge kind="neutral">NOT CONFIGURED</Badge></div>
      </section>
    </div>
    <div className="disclaimer settings-disclaimer"><ShieldCheck size={16} /> Security note: this frontend is a monitoring dashboard. Keep webhook secrets, Telegram credentials, and database credentials on the server only.</div>
  </>
}

export default App