import { useEffect, useState } from "react";
import "./Topbar.css";
import { Menu, RefreshCw, UserRound } from "lucide-react";

const statusLabels = {
  live: "API Connected",
  offline: "API Offline",
  checking: "Checking connection",
};

export default function Topbar({
  onMenuClick,
  onRefresh,
  onProfileClick,
  loading = false,
  apiStatus = "checking",
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const status = statusLabels[apiStatus] ? apiStatus : "checking";

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <header className="topbar">
      <div className="topbar-clock">
        <div className="clock-time">{time}</div>
        <div className="clock-date">{date}</div>
      </div>

      <div className="topbar-actions">
        <button
          className="icon-button mobile-menu"
          onClick={onMenuClick}
          aria-label="Open navigation"
          title="Open navigation"
        >
          <Menu size={19} />
        </button>

        <div
          className={`connection-pill ${status}`}
          role="status"
          aria-live="polite"
        >
          <span className="connection-dot" />
          <span>{statusLabels[status]}</span>
        </div>

        <button
          className="icon-button refresh-button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh dashboard"
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>

        <div className="topbar-divider" />

        <button
          className="profile-button"
          onClick={onProfileClick}
          aria-label="Open profile"
          title="Profile"
        >
          <UserRound size={19} />
        </button>
      </div>
    </header>
  );
}
