import "./Badge.css";
const variants = {
  BUY: "green",
  SELL: "red",
  HOLD: "amber",
  SENT: "green",
  FAILED: "red",
  DEMO: "amber",
  OPEN: "blue",
  CLOSED: "neutral",
};

export default function Badge({ children, variant }) {
  const color =
    variant || variants[String(children).toUpperCase()] || "neutral";

  return <span className={`badge badge-${color}`}>{children}</span>;
}
