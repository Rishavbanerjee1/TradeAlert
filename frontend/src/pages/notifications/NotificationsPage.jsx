import "./NotificationsPage.css";

import { useCallback, useEffect, useState } from "react";
import {
  Send,
  MessageSquare,
  TrendingUp,
  Eye,
  AlertCircle,
  RefreshCw,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

import {
  sendNotification,
  fetchNotificationHistory,
} from "../../services/api/notifications";

const FILTERS = ["all", "sent", "demo", "failed"];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  if (status === "sent") return "Sent";
  if (status === "demo") return "Demo";
  if (status === "failed") return "Failed";
  return status || "Unknown";
}

function StatusIcon({ status }) {
  if (status === "sent") {
    return <CheckCircle2 size={14} />;
  }

  if (status === "failed") {
    return <XCircle size={14} />;
  }

  return <AlertCircle size={14} />;
}

export default function NotificationsPage() {
  const [type, setType] = useState("custom");
  const [message, setMessage] = useState("");
  const [symbol, setSymbol] = useState("");
  const [action, setAction] = useState("BUY");
  const [price, setPrice] = useState("");
  const [strategy, setStrategy] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await fetchNotificationHistory(100);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setHistoryError(error.message || "Could not load notification history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const preview =
    type === "custom"
      ? message.trim()
      : [
          `TRADE ALERT: ${action}`,
          `Symbol: ${symbol || "—"}`,
          `Price: ${price || "—"}`,
          `Strategy: ${strategy || "Manual alert"}`,
        ].join("\n");

  const canSend =
    type === "custom"
      ? message.trim().length > 0
      : symbol.trim().length > 0 &&
        price.trim().length > 0 &&
        Number.isFinite(Number(price)) &&
        Number(price) > 0;

  async function handleSend(event) {
    event.preventDefault();

    if (!canSend || sending) return;

    setSending(true);
    setResult(null);

    const payload =
      type === "custom"
        ? {
            type: "custom",
            message: message.trim(),
          }
        : {
            type: "signal",
            action,
            symbol: symbol.trim().toUpperCase(),
            price: Number(price),
            strategy: strategy.trim() || "Manual alert",
          };

    try {
      const response = await sendNotification(payload);
      const status = response?.status || "unknown";

      setResult({
        status,
        message:
          response?.message ||
          (status === "sent"
            ? "Telegram confirmed the message was sent."
            : status === "demo"
              ? "Demo mode: message was not delivered to Telegram."
              : "Telegram delivery failed."),
      });

      if (status === "sent" || status === "demo" || status === "failed") {
        setMessage("");
        setSymbol("");
        setPrice("");
        setStrategy("");
      }

      // Reload saved history after the backend records the attempt.
      await loadHistory();
    } catch (error) {
      setResult({
        status: "failed",
        message: error.message || "Could not send the notification.",
      });

      // Reload in case the backend saved the attempt before an error occurred.
      await loadHistory();
    } finally {
      setSending(false);
    }
  }

  const filteredHistory =
    filter === "all"
      ? history
      : history.filter((item) => item.status === filter);

  const counts = {
    all: history.length,
    sent: history.filter((item) => item.status === "sent").length,
    demo: history.filter((item) => item.status === "demo").length,
    failed: history.filter((item) => item.status === "failed").length,
  };

  return (
    <>
      <PageHeader
        eyebrow="TELEGRAM INTEGRATION"
        title="Notifications"
        description="Compose messages, send manual alerts and track your notification history."
      />

      <div className="notification-layout">
        <section className="panel notification-composer">
          <div className="panel-heading">
            <div>
              <h2>Compose notification</h2>
              <p>Choose a message type and enter its details.</p>
            </div>
          </div>

          <div className="message-type-selector">
            <button
              className={
                type === "custom" ? "message-type active" : "message-type"
              }
              onClick={() => {
                setType("custom");
                setResult(null);
              }}
              type="button"
            >
              <MessageSquare size={17} />
              <span>
                <b>Custom message</b>
                <small>Write your own message</small>
              </span>
            </button>

            <button
              className={
                type === "signal" ? "message-type active" : "message-type"
              }
              onClick={() => {
                setType("signal");
                setResult(null);
              }}
              type="button"
            >
              <TrendingUp size={17} />
              <span>
                <b>Signal alert</b>
                <small>Compose a trading alert</small>
              </span>
            </button>
          </div>

          <form onSubmit={handleSend}>
            {type === "custom" ? (
              <div className="form-field">
                <label htmlFor="custom-message">Message</label>
                <textarea
                  id="custom-message"
                  rows={7}
                  maxLength={4000}
                  placeholder="Write your Telegram notification..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <div className="field-hint">
                  {message.length}/4000 characters
                </div>
              </div>
            ) : (
              <>
                <div className="form-field">
                  <label htmlFor="signal-symbol">Symbol</label>
                  <input
                    id="signal-symbol"
                    placeholder="e.g. BTCUSD, RELIANCE"
                    value={symbol}
                    maxLength={30}
                    onChange={(event) => setSymbol(event.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Signal action</label>

                  <div className="signal-action-selector">
                    {["BUY", "HOLD", "SELL"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`signal-action-button ${item.toLowerCase()} ${
                          action === item ? "active" : ""
                        }`}
                        onClick={() => {
                          setAction(item);
                          setResult(null);
                        }}
                        aria-pressed={action === item}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="signal-price">Price</label>
                  <input
                    id="signal-price"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Enter price"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="signal-strategy">Strategy</label>
                  <input
                    id="signal-strategy"
                    placeholder="Optional strategy name"
                    value={strategy}
                    maxLength={100}
                    onChange={(event) => setStrategy(event.target.value)}
                  />
                </div>
              </>
            )}

            {result && (
              <div className={`send-result ${result.status}`}>
                <StatusIcon status={result.status} />
                <span>{result.message}</span>
              </div>
            )}

            <div className="composer-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMessage("");
                  setSymbol("");
                  setPrice("");
                  setStrategy("");
                  setResult(null);
                }}
              >
                Clear
              </Button>

              <Button type="submit" disabled={!canSend || sending}>
                <Send size={14} />
                {sending ? "Sending..." : "Send notification"}
              </Button>
            </div>
          </form>
        </section>

        <aside className="panel preview-panel">
          <div className="panel-heading">
            <div>
              <h2>Message preview</h2>
              <p>Preview of the composed message.</p>
            </div>
            <Eye size={17} />
          </div>

          <div className="telegram-preview">
            <div className="telegram-preview-header">
              <div className="telegram-avatar">
                <Send size={15} />
              </div>
              <div>
                <b>TradeAlert</b>
                <small>Telegram message preview</small>
              </div>
            </div>

            <div className="telegram-message">
              {preview || "Your message preview will appear here."}
            </div>

            {type === "signal" && (
              <div className="preview-badges">
                <Badge>{action}</Badge>
                <Badge variant="neutral">MANUAL ALERT</Badge>
              </div>
            )}
          </div>

          <div className="preview-note">
            <AlertCircle size={15} />
            <span>
              Messages are sent to the Telegram destination configured on the
              backend. Check the delivery result before assuming delivery.
            </span>
          </div>
        </aside>
      </div>

      <section className="panel notification-history">
        <div className="notification-history-header">
          <div>
            <h2>Notification history</h2>
            <p>Previously sent and attempted manual notifications.</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={loadHistory}
            disabled={historyLoading}
          >
            <RefreshCw size={14} className={historyLoading ? "spin" : ""} />
            Refresh
          </Button>
        </div>

        <div className="history-stats">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={`history-stat ${filter === item ? "active" : ""}`}
              onClick={() => setFilter(item)}
            >
              <span>{item === "all" ? "All" : statusLabel(item)}</span>
              <strong>{counts[item]}</strong>
            </button>
          ))}
        </div>

        {historyError && (
          <div className="history-error">
            <AlertCircle size={16} />
            <span>{historyError}</span>
            <button type="button" onClick={loadHistory}>
              Try again
            </button>
          </div>
        )}

        {historyLoading && history.length === 0 ? (
          <div className="history-empty">
            <RefreshCw size={20} className="spin" />
            <p>Loading notification history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="history-empty">
            <Clock3 size={22} />
            <h3>No notifications found</h3>
            <p>
              {filter === "all"
                ? "Your manual notification attempts will appear here."
                : `There are no ${filter} notifications in this history.`}
            </p>
          </div>
        ) : (
          <div className="notification-history-list">
            {filteredHistory.map((item) => (
              <article className="history-item" key={item.id}>
                <div className="history-item-main">
                  <div className="history-item-title">
                    <strong>
                      {item.type === "signal"
                        ? `${item.action || "SIGNAL"}${item.symbol ? ` · ${item.symbol}` : ""}`
                        : "Custom message"}
                    </strong>

                    <span className={`history-status ${item.status}`}>
                      <StatusIcon status={item.status} />
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <p className="history-message">{item.message}</p>

                  {item.type === "signal" && (
                    <div className="history-metadata">
                      {item.price != null && <span>Price: {item.price}</span>}
                      {item.strategy && <span>Strategy: {item.strategy}</span>}
                    </div>
                  )}

                  <div className="history-timestamp">
                    <Clock3 size={13} />
                    {formatDate(item.created_at)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="history-footer">
          Showing {filteredHistory.length} of {history.length} loaded records
        </div>
      </section>

      <p className="disclaimer">
        Manual notifications are separate from TradingView webhook signals. This
        page records manual notification attempts; TradingView signals remain
        available in signal history.
      </p>
    </>
  );
}
