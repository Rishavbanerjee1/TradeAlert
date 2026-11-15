import "./NotificationsPage.css";
import { useState } from "react";
import {
  Send,
  MessageSquare,
  TrendingUp,
  Eye,
  AlertCircle,
} from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { sendNotification } from "../../services/api/notifications";

export default function NotificationsPage() {
  const [type, setType] = useState("custom");
  const [message, setMessage] = useState("");
  const [symbol, setSymbol] = useState("");
  const [action, setAction] = useState("BUY");
  const [price, setPrice] = useState("");
  const [strategy, setStrategy] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

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
          status === "sent"
            ? "Telegram confirmed the message was sent."
            : status === "demo"
              ? "Demo mode: the message was not delivered to Telegram."
              : status === "failed"
                ? "Telegram delivery failed."
                : "The backend responded, but delivery status was not recognised.",
      });

      if (status === "sent" || status === "demo") {
        setMessage("");
        setSymbol("");
        setPrice("");
        setStrategy("");
      }
    } catch (error) {
      setResult({
        status: "failed",
        message: error.message || "Could not send the notification.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="TELEGRAM INTEGRATION"
        title="Notifications"
        description="Compose and send manual messages to your configured Telegram destination."
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
                  <label htmlFor="signal-action">Action</label>
                  <select
                    id="signal-action"
                    value={action}
                    onChange={(event) => setAction(event.target.value)}
                  >
                    <option value="BUY">BUY</option>
                    <option value="HOLD">HOLD</option>
                    <option value="SELL">SELL</option>
                  </select>
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
                <AlertCircle size={16} />
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
              The message is sent to the Telegram destination configured on the
              backend. Check the delivery result before assuming it was
              delivered.
            </span>
          </div>
        </aside>
      </div>

      <p className="disclaimer">
        Manual notifications are separate from TradingView webhook signals. The
        backend must implement the notification endpoint before sending is
        available.
      </p>
    </>
  );
}
