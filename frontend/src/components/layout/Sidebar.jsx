import "./Sidebar.css";
import { X, ChevronDown, Zap } from "lucide-react";

export default function Sidebar({
  navigation,
  activePage,
  setActivePage,
  open,
  onClose,
}) {
  function navigate(id) {
    setActivePage(id);
    onClose();
  }

  return (
    <>
      {open && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Zap size={20} />
          </div>

          <div>
            <div className="brand-name">
              Trade<span>Alert</span>
            </div>
            <div className="brand-caption">TRADING NOTIFICATIONS</div>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <button className="workspace-switch">
          <div className="workspace-avatar">TA</div>

          <div className="workspace-copy">
            <b>Trading Desk</b>
            <span>Personal workspace</span>
          </div>

          <ChevronDown size={15} />
        </button>

        <div className="nav-label">MENU</div>

        <nav className="nav-list">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => navigate(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-info">
            <div className="sidebar-info-icon">
              <Zap size={15} />
            </div>
            <b>TradingView connected?</b>
            <p>Configure your webhook to start receiving alerts.</p>
            <button onClick={() => navigate("settings")}>
              Configure integration →
            </button>
          </div>

          <div className="profile">
            <div className="profile-avatar">TA</div>
            <div className="profile-copy">
              <b>Trading Desk</b>
              <span>Workspace owner</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
