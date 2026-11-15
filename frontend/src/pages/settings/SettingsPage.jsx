import "./SettingsPage.css";
import { useState } from "react";
import { Copy, RefreshCw, ShieldCheck, Send, Server } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { BASE_URL } from "../../services/api/client";

function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="copy-button" onClick={copy}>
      <Copy size={13} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function SettingsPage({ refreshDashboard, loading }) {
  const webhookUrl = `${BASE_URL}/webhook/tradingview`;

  return (
    <>
      <PageHeader
        eyebrow="CONFIGURATION"
        title="Settings"
        description="Configure and review your TradeAlert integrations."
      />

      <div className="settings-grid">
        <section className="panel settings-card">
          <div className="settings-title">
            <div className="settings-icon">
              <Server size={17} />
            </div>
            <div>
              <h2>Backend API</h2>
              <p>Connection information</p>
            </div>
          </div>

          <div className="setting-row">
            <div>
              <b>API base URL</b>
              <small>Configured frontend API address</small>
            </div>
            <code>{BASE_URL}</code>
          </div>

          <div className="setting-row">
            <div>
              <b>Webhook endpoint</b>
              <small>TradingView sends alerts here</small>
            </div>
            <div className="setting-value">
              <code>{webhookUrl}</code>
              <CopyValue value={webhookUrl} />
            </div>
          </div>

          <div className="setting-row">
            <div>
              <b>Signals endpoint</b>
              <small>Retrieve received signals</small>
            </div>
            <code>GET /api/signals</code>
          </div>

          <div className="setting-row">
            <div>
              <b>Positions endpoint</b>
              <small>Retrieve tracked positions</small>
            </div>
            <code>GET /api/positions</code>
          </div>

          <Button
            variant="secondary"
            onClick={refreshDashboard}
            disabled={loading}
          >
            <RefreshCw size={14} />
            Refresh connection data
          </Button>
        </section>

        <section className="panel settings-card">
          <div className="settings-title">
            <div className="settings-icon telegram">
              <Send size={17} />
            </div>
            <div>
              <h2>Telegram</h2>
              <p>Notification integration</p>
            </div>
          </div>

          <div className="info-box">
            <ShieldCheck size={17} />
            <span>
              Telegram credentials must remain on the backend. Never put your
              bot token in frontend environment variables or browser code.
            </span>
          </div>

          <div className="setting-row">
            <div>
              <b>Bot token</b>
              <small>Configured through backend environment</small>
            </div>
            <span className="plain-value">Backend only</span>
          </div>

          <div className="setting-row">
            <div>
              <b>Chat ID</b>
              <small>Configured through backend environment</small>
            </div>
            <span className="plain-value">Backend only</span>
          </div>

          <div className="setting-row">
            <div>
              <b>Delivery status</b>
              <small>Requires backend verification</small>
            </div>
            <span className="plain-value">Not verified</span>
          </div>
        </section>
      </div>

      <p className="disclaimer">
        These settings display integration information. They do not modify
        backend environment variables.
      </p>
    </>
  );
}
