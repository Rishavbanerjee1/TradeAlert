import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { formatDate, formatPrice } from "../../utils/formatters";

export default function PositionsPage({ dashboard }) {
  const positions = dashboard?.positions || [];

  return (
    <>
      <PageHeader
        eyebrow="POSITION TRACKING"
        title="Positions"
        description="View positions tracked from incoming trading signals."
      />

      <section className="panel full-panel">
        <div className="panel-heading">
          <div>
            <h2>Tracked positions</h2>
            <p>Position information maintained by the backend.</p>
          </div>
        </div>

        {positions.length === 0 ? (
          <EmptyState
            title="No positions yet"
            description="Positions will appear when your configured strategy generates relevant signals."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SYMBOL</th>
                  <th>STATUS</th>
                  <th>ENTRY PRICE</th>
                  <th>QUANTITY</th>
                  <th>LAST UPDATED</th>
                </tr>
              </thead>

              <tbody>
                {positions.map((position, index) => (
                  <tr key={position.id ?? index}>
                    <td>
                      <b>{position.symbol || "—"}</b>
                    </td>
                    <td>
                      <Badge variant="blue">{position.status || "OPEN"}</Badge>
                    </td>
                    <td>
                      {formatPrice(position.entry_price ?? position.price)}
                    </td>
                    <td>{position.quantity ?? "—"}</td>
                    <td>
                      {formatDate(position.updated_at || position.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="disclaimer">
        Positions are informational records maintained by TradeAlert. They do
        not represent broker-connected holdings or executed trades.
      </p>
    </>
  );
}
