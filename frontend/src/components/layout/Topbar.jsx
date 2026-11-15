import "./Topbar.css";
import { Menu, RefreshCw, Bell } from "lucide-react";

const statusLabels = {
  live: "API Live",
  offline: "API Offline",
  checking: "Checking API",
};

export default function Topbar({
  title,
  onMenuClick,
  onRefresh,
  loading,
  apiStatus = "checking",
}) {
  return (
    <header className="topbar">
      <div className="top-left">
        <button
          className="icon-button mobile-menu"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <div className="breadcrumb">
          Workspace <span>/</span> <b>{title}</b>
        </div>
      </div>

      <div className="top-actions">
        <div className={`connection-pill ${apiStatus}`}>
          <span className="connection-dot" />
          {statusLabels[apiStatus] || "Checking API"}
        </div>

        <button
          className="icon-button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh dashboard"
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
        </button>

        <button
          className="icon-button"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>

        <div className="top-avatar">TA</div>
      </div>
    </header>
  );
}
