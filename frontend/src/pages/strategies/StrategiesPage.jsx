import "./StrategiesPage.css";
import { Workflow, Code2, ArrowUpRight } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

export default function StrategiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="INTEGRATIONS"
        title="Strategies"
        description="Manage the TradingView strategies that send signals to TradeAlert."
      />

      <section className="panel strategy-card">
        <div className="strategy-icon">
          <Workflow size={22} />
        </div>

        <div className="strategy-content">
          <div className="strategy-card-top">
            <div>
              <h2>TradingView Webhook</h2>
              <p>Receive alerts from your Pine Script strategies.</p>
            </div>

            <Badge variant="amber">CONFIGURATION REQUIRED</Badge>
          </div>

          <div className="strategy-details">
            <div>
              <span>INTEGRATION</span>
              <b>TradingView</b>
            </div>

            <div>
              <span>SUPPORTED SIGNALS</span>
              <b>BUY / SELL</b>
            </div>

            <div>
              <span>DELIVERY</span>
              <b>Telegram notifications</b>
            </div>
          </div>

          <div className="strategy-note">
            <Code2 size={17} />
            <p>
              Add the TradeAlert webhook URL and your configured secret to your
              TradingView alert message.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
