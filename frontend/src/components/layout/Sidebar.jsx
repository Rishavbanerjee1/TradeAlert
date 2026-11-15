import "./Sidebar.css";
import { X, Zap } from "lucide-react";

export default function Sidebar({
  navigation,
  activePage,
  setActivePage,
  open,
  onClose,
}) {
  function navigate(id) {
    setActivePage(id);
    onClose?.();
  }

  const mainNavigation = navigation.filter(({ id }) => id !== "settings");

  const settingsNavigation = navigation.filter(({ id }) => id === "settings");

  function renderNavItem({ id, label, icon: Icon }) {
    return (
      <button
        key={id}
        type="button"
        className={`nav-item ${activePage === id ? "active" : ""}`}
        onClick={() => navigate(id)}
        aria-current={activePage === id ? "page" : undefined}
      >
        <Icon size={18} strokeWidth={1.8} />
        <span>{label}</span>
      </button>
    );
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
        {/* Brand */}
        <div className="brand">
          <div className="brand-mark">
            <Zap size={20} />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              Trade<span>Alert</span>
            </div>

            <div className="brand-caption">SIGNALS & ANALYTICS</div>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="nav-label">PLATFORM</div>

        <nav className="nav-list" aria-label="Main navigation">
          {mainNavigation.map(renderNavItem)}
        </nav>

        {/* Bottom Navigation */}
        {settingsNavigation.length > 0 && (
          <div className="sidebar-bottom">
            <nav aria-label="Secondary navigation">
              {settingsNavigation.map(renderNavItem)}
            </nav>
          </div>
        )}
      </aside>
    </>
  );
}
