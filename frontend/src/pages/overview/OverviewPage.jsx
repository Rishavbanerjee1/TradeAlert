import "./OverviewPage.css";
import {
  Activity,
  BriefcaseBusiness,
  TrendingUp,
  Bell,
  ArrowRight,
} from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { formatDate, formatPrice } from "../../utils/formatters";

export default function OverviewPage({ dashboard }) {
  const signals = dashboard?.signals || [];
  const positions = dashboard?.positions || [];

  const buyCount = signals.filter(
    (signal) => String(signal.action).toUpperCase() === "BUY",
  ).length;

  const sellCount = signals.filter(
    (signal) => String(signal.action).toUpperCase() === "SELL",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE OVERVIEW"
        title="Overview"
        description="Monitor incoming trading signals and notification activity."
      />

      <div className="stats-grid">
        <StatCard
          label="Total signals"
          value={signals.length}
          detail="Received by the platform"
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
          label="Open positions"
          value={positions.length}
          detail="Currently tracked by backend"
          icon={Bell}
          color="purple"
        />
      </div>

      <section className="panel full-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent signals</h2>
            <p>Latest TradingView signals received by the backend.</p>
          </div>
        </div>

        {signals.length === 0 ? (
          <EmptyState
            title="No signals received"
            description="TradingView signals will appear here when your webhook is configured."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SYMBOL</th>
                  <th>ACTION</th>
                  <th>PRICE</th>
                  <th>STRATEGY</th>
                  <th>RECEIVED</th>
                  <th>NOTIFICATION</th>
                </tr>
              </thead>

              <tbody>
                {signals.slice(0, 8).map((signal, index) => (
                  <tr key={signal.id ?? index}>
                    <td>
                      <b>{signal.symbol || "—"}</b>
                    </td>
                    <td>
                      <Badge>{signal.action || "UNKNOWN"}</Badge>
                    </td>
                    <td>{formatPrice(signal.price)}</td>
                    <td>{signal.strategy || "Default"}</td>
                    <td>{formatDate(signal.created_at || signal.timestamp)}</td>
                    <td>
                      <Badge variant={signal.notified ? "green" : "neutral"}>
                        {signal.notified ? "SENT" : "NOT SENT"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
