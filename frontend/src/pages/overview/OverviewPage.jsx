import { useMemo, useState } from "react";
import "./OverviewPage.css";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Radio,
  TrendingUp,
  Wallet,
  CalendarDays,
} from "lucide-react";

import { Link } from "react-router-dom";

import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";

import { formatDate, formatPrice } from "../../utils/formatters";

// ------------------------------------------
// DATE HELPERS
// ------------------------------------------

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getToday() {
  return getLocalDateString(new Date());
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);

  return getLocalDateString(date);
}

// Try multiple possible timestamp fields.
// This also handles cases where an earlier field exists but is invalid.
function getRecordDate(record) {
  const possibleValues = [
    record?.created_at,
    record?.timestamp,
    record?.createdAt,
    record?.received_at,
    record?.receivedAt,
    record?.signal_time,
    record?.signalTime,
    record?.alert_time,
    record?.alertTime,
    record?.date,
    record?.time,
  ];

  for (const value of possibleValues) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    let date;

    if (typeof value === "number" || /^\d+$/.test(String(value))) {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue)) continue;

      date = new Date(numericValue < 1e12 ? numericValue * 1000 : numericValue);
    } else {
      date = new Date(value);
    }

    if (!Number.isNaN(date.getTime())) {
      return getLocalDateString(date);
    }
  }

  return null;
}

function isWithinDateRange(record, startDate, endDate) {
  const recordDate = getRecordDate(record);

  // A record without a valid date cannot be assigned to a custom period.
  if (!recordDate) return false;

  if (startDate && recordDate < startDate) return false;
  if (endDate && recordDate > endDate) return false;

  return true;
}

// ------------------------------------------
// SIGNAL HELPERS
// ------------------------------------------

function getAction(action) {
  const value = String(action || "").toUpperCase();

  if (value === "BUY") return "buy";
  if (value === "SELL") return "sell";
  if (value === "HOLD") return "hold";

  return "unknown";
}

function getNotificationStatus(signal) {
  if (signal.notified === true) {
    return {
      label: "Delivered",
      className: "delivered",
      icon: CheckCircle2,
    };
  }

  if (signal.notified === false) {
    return {
      label: "Not sent",
      className: "not-sent",
      icon: Clock3,
    };
  }

  return {
    label: "Unknown",
    className: "unknown",
    icon: Activity,
  };
}

// ------------------------------------------
// SIGNAL DISTRIBUTION
// ------------------------------------------

function InsightBar({ label, count, total, type }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="insight-bar-item">
      <div className="insight-bar-heading">
        <div className="insight-bar-label">
          <span className={`insight-dot ${type}`} />
          <span>{label}</span>
        </div>

        <div className="insight-bar-value">
          <strong>{count}</strong>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      </div>

      <div className="insight-track">
        <div
          className={`insight-fill ${type}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SignalInsights({ buyCount, sellCount, holdCount, total }) {
  return (
    <section className="panel insight-card">
      <div className="insight-card-header">
        <div className="insight-heading-icon signal-icon">
          <Radio size={18} />
        </div>

        <div>
          <h3>Signal distribution</h3>
          <p>Breakdown of received trading signals</p>
        </div>
      </div>

      <div className="signal-distribution">
        <div className="distribution-total">
          <strong>{total}</strong>
          <span>Total signals</span>
        </div>

        <div className="distribution-bars">
          <InsightBar label="BUY" count={buyCount} total={total} type="buy" />

          <InsightBar
            label="SELL"
            count={sellCount}
            total={total}
            type="sell"
          />

          <InsightBar
            label="HOLD"
            count={holdCount}
            total={total}
            type="hold"
          />
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------
// NOTIFICATION SUMMARY
// ------------------------------------------

function NotificationSummary({ sent, notSent, unknown, total }) {
  const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : 0;

  return (
    <section className="panel insight-card notification-insight">
      <div className="insight-card-header">
        <div className="insight-heading-icon notification-icon">
          <Bell size={18} />
        </div>

        <div>
          <h3>Notification delivery</h3>
          <p>Telegram notification activity</p>
        </div>
      </div>

      <div className="delivery-overview">
        <div>
          <div className="delivery-percentage">{deliveryRate}%</div>
          <span>Delivery rate</span>
        </div>

        <div className="delivery-progress">
          <div
            className="delivery-progress-fill"
            style={{ width: `${deliveryRate}%` }}
          />
        </div>
      </div>

      <div className="delivery-stats">
        <div>
          <span className="delivery-status-dot sent" />
          <span>Sent</span>
          <strong>{sent}</strong>
        </div>

        <div>
          <span className="delivery-status-dot pending" />
          <span>Not sent</span>
          <strong>{notSent}</strong>
        </div>

        <div>
          <span className="delivery-status-dot unknown" />
          <span>Unknown</span>
          <strong>{unknown}</strong>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------
// NOTIFICATION STATUS
// ------------------------------------------

function NotificationStatus({ signal }) {
  const status = getNotificationStatus(signal);
  const Icon = status.icon;

  return (
    <div className={`notification-status ${status.className}`}>
      <Icon size={14} />
      <span>{status.label}</span>
    </div>
  );
}

// ------------------------------------------
// RECENT SIGNALS
// ------------------------------------------

function RecentSignals({ signals }) {
  return (
    <section className="panel recent-signals-panel">
      <div className="panel-heading overview-section-heading">
        <div>
          <div className="section-eyebrow">ACTIVITY</div>
          <h2>Recent signals</h2>
          <p>Latest TradingView alerts received by your backend.</p>
        </div>

        <Link
          to="/signals"
          className="recent-count recent-count-link"
          aria-label={`View all ${signals.length} signals`}
        >
          <Activity size={15} />
          <span>{signals.length} records</span>
          <ArrowUpRight size={13} className="recent-count-arrow" />
        </Link>
      </div>

      {signals.length === 0 ? (
        <div className="overview-empty">
          <EmptyState
            title="No signals in this date range"
            description="Try selecting All time or choosing a different date range."
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="overview-table">
            <thead>
              <tr>
                <th>ASSET</th>
                <th>ACTION</th>
                <th>PRICE</th>
                <th>STRATEGY</th>
                <th>RECEIVED</th>
                <th>NOTIFICATION</th>
              </tr>
            </thead>

            <tbody>
              {signals.slice(0, 8).map((signal, index) => {
                const action = getAction(signal.action);

                return (
                  <tr key={signal.id ?? index}>
                    <td>
                      <div className="overview-asset">
                        <div className={`overview-asset-icon ${action}`}>
                          {String(signal.symbol || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="overview-asset-info">
                          <strong>{signal.symbol || "Unknown"}</strong>
                          <span>TradingView</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`action-badge ${action}`}>
                        {action === "buy" && <ArrowDownRight size={14} />}

                        {action === "sell" && <ArrowUpRight size={14} />}

                        {signal.action || "UNKNOWN"}
                      </span>
                    </td>

                    <td className="signal-price">
                      {formatPrice(signal.price)}
                    </td>

                    <td>
                      <span className="strategy-name">
                        {signal.strategy || "Default"}
                      </span>
                    </td>

                    <td>
                      <span className="signal-time">
                        {formatDate(
                          signal.created_at ||
                            signal.timestamp ||
                            signal.createdAt ||
                            signal.received_at ||
                            signal.date,
                        )}
                      </span>
                    </td>

                    <td>
                      <NotificationStatus signal={signal} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------
// DATE FILTER
// ------------------------------------------

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "All time", value: "all" },
];

function DateFilter({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
}) {
  return (
    <section className="overview-date-filter">
      <div className="date-filter-left">
        <div className="date-filter-icon">
          <CalendarDays size={17} />
        </div>

        <div className="date-filter-heading">
          <strong>Date range</strong>
          <span>Filter dashboard activity</span>
        </div>
      </div>

      <div className="date-filter-controls">
        <div className="date-preset-group">
          {DATE_PRESETS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`date-preset ${preset === item.value ? "active" : ""}`}
              onClick={() => onPresetChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="custom-date-range">
          <input
            type="date"
            aria-label="Start date"
            value={startDate}
            max={endDate || getToday()}
            onChange={(event) => onStartDateChange(event.target.value)}
          />

          <span>to</span>

          <input
            type="date"
            aria-label="End date"
            value={endDate}
            min={startDate || undefined}
            max={getToday()}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------
// MAIN OVERVIEW PAGE
// ------------------------------------------

export default function OverviewPage({ dashboard }) {
  const signals = Array.isArray(dashboard?.signals) ? dashboard.signals : [];

  const positions = Array.isArray(dashboard?.positions)
    ? dashboard.positions
    : [];

  // All time is the default so existing records are visible.
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handlePresetChange(value) {
    const today = getToday();

    setDatePreset(value);

    if (value === "today") {
      setStartDate(today);
      setEndDate(today);
    } else if (value === "7d") {
      setStartDate(getDateDaysAgo(6));
      setEndDate(today);
    } else if (value === "30d") {
      setStartDate(getDateDaysAgo(29));
      setEndDate(today);
    } else if (value === "90d") {
      setStartDate(getDateDaysAgo(89));
      setEndDate(today);
    } else if (value === "all") {
      setStartDate("");
      setEndDate("");
    }
  }

  function handleStartDateChange(value) {
    setStartDate(value);
    setDatePreset("custom");
  }

  function handleEndDateChange(value) {
    setEndDate(value);
    setDatePreset("custom");
  }

  const filteredSignals = useMemo(() => {
    if (datePreset === "all") return signals;

    return signals.filter((signal) =>
      isWithinDateRange(signal, startDate, endDate),
    );
  }, [signals, startDate, endDate, datePreset]);

  // Signal statistics follow the selected date range.
  const buyCount = filteredSignals.filter(
    (signal) => String(signal.action || "").toUpperCase() === "BUY",
  ).length;

  const sellCount = filteredSignals.filter(
    (signal) => String(signal.action || "").toUpperCase() === "SELL",
  ).length;

  const holdCount = filteredSignals.filter(
    (signal) => String(signal.action || "").toUpperCase() === "HOLD",
  ).length;

  const sentCount = filteredSignals.filter(
    (signal) => signal.notified === true,
  ).length;

  const notSentCount = filteredSignals.filter(
    (signal) => signal.notified === false,
  ).length;

  const unknownCount = filteredSignals.length - sentCount - notSentCount;

  return (
    <div className="overview-page">
      <PageHeader
        eyebrow="WORKSPACE OVERVIEW"
        title="Overview"
        description="Your trading activity, incoming signals and notification performance at a glance."
      />

      <div className="overview-context">
        <div className="context-indicator">
          <span className="context-dot" />
          <span>Signal monitoring</span>
        </div>

        <span className="context-divider" />

        <span className="context-description">TradingView integration</span>
      </div>

      <DateFilter
        preset={datePreset}
        startDate={startDate}
        endDate={endDate}
        onPresetChange={handlePresetChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />

      <div className="stats-grid overview-stats">
        <StatCard
          label="Total signals"
          value={filteredSignals.length}
          detail="Alerts received"
          icon={Activity}
          color="blue"
        />

        <StatCard
          label="Buy signals"
          value={buyCount}
          detail="BUY actions received"
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          label="Sell signals"
          value={sellCount}
          detail="SELL actions received"
          icon={BriefcaseBusiness}
          color="orange"
        />

        <StatCard
          label="Tracked positions"
          value={positions.length}
          detail="Current tracked positions"
          icon={Wallet}
          color="purple"
        />
      </div>

      <div className="overview-insights-grid">
        <SignalInsights
          buyCount={buyCount}
          sellCount={sellCount}
          holdCount={holdCount}
          total={filteredSignals.length}
        />

        <NotificationSummary
          sent={sentCount}
          notSent={notSentCount}
          unknown={unknownCount}
          total={filteredSignals.length}
        />
      </div>

      <RecentSignals signals={filteredSignals} />
    </div>
  );
}
