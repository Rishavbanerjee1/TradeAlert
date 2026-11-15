import "./StatCard.css";
export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  color = "blue",
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        {Icon && (
          <div className={`stat-icon ${color}`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="stat-value">{value}</div>

      {detail && <div className="stat-detail">{detail}</div>}
    </div>
  );
}
