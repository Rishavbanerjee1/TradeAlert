import "./SignalsPage.css";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { formatDate, formatPrice } from "../../utils/formatters";

export default function SignalsPage({ dashboard }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const signals = dashboard?.signals || [];

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      const action = String(signal.action || "").toUpperCase();

      const matchesFilter = filter === "ALL" || action === filter;

      const query = search.toLowerCase();
      const matchesSearch =
        String(signal.symbol || "")
          .toLowerCase()
          .includes(query) ||
        String(signal.strategy || "")
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [signals, search, filter]);

  return (
    <>
      <PageHeader
        eyebrow="MARKET ACTIVITY"
        title="Signals"
        description="Review all TradingView signals received by TradeAlert."
      />

      <section className="panel full-panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search symbol or strategy..."
            />
          </label>

          <div className="filter-wrap">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter signals"
            >
              <option value="ALL">All signals</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
              <option value="HOLD">Hold</option>
            </select>
          </div>
        </div>

        {filteredSignals.length === 0 ? (
          <EmptyState
            title="No matching signals"
            description="Signals will appear here when they are received."
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
                  <th>TIME</th>
                  <th>TELEGRAM</th>
                </tr>
              </thead>

              <tbody>
                {filteredSignals.map((signal, index) => (
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
