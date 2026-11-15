import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  BriefcaseBusiness,
  Layers3,
  Send,
  Settings,
  RefreshCw,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import OverviewPage from "../pages/overview/OverviewPage";
import SignalsPage from "../pages/signals/SignalsPage";
import PositionsPage from "../pages/positions/PositionsPage";
import StrategiesPage from "../pages/strategies/StrategiesPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import SettingsPage from "../pages/settings/SettingsPage";

import { fetchDashboard } from "../services/api/dashboard";
import { BASE_URL } from "../services/api/client";
import { mockDashboard } from "../data/mockData";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "signals", label: "Signals", icon: Activity },
  { id: "positions", label: "Positions", icon: BriefcaseBusiness },
  { id: "strategies", label: "Strategies", icon: Layers3 },
  { id: "notifications", label: "Notifications", icon: Send },
  { id: "settings", label: "Settings", icon: Settings },
];

const pages = {
  overview: OverviewPage,
  signals: SignalsPage,
  positions: PositionsPage,
  strategies: StrategiesPage,
  notifications: NotificationsPage,
  settings: SettingsPage,
};

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const [dashboard, setDashboard] = useState(mockDashboard);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");

  async function refreshDashboard() {
    setLoading(true);
    setError("");

    try {
      const result = await fetchDashboard();
      setDashboard(result);
    } catch (err) {
      setError(err.message || "Unable to connect to the backend");
    } finally {
      setLoading(false);
    }
  }

  // Check backend health independently of dashboard data.
  useEffect(() => {
    let mounted = true;

    async function checkApiHealth() {
      try {
        const response = await fetch(`${BASE_URL}/health`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        const result = await response.json();

        if (mounted) {
          setApiStatus(result.ok ? "live" : "offline");
        }
      } catch {
        if (mounted) {
          setApiStatus("offline");
        }
      }
    }

    checkApiHealth();

    const interval = setInterval(checkApiHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, []);

  const CurrentPage = pages[activePage];
  const activeNavigation = navigation.find((item) => item.id === activePage);

  return (
    <div className="app-shell">
      <Sidebar
        navigation={navigation}
        activePage={activePage}
        setActivePage={setActivePage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-area">
        <Topbar
          title={activeNavigation?.label || "Overview"}
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={refreshDashboard}
          loading={loading}
          apiStatus={apiStatus}
        />

        <main className="page-content">
          {error && (
            <div className="notice">
              <span>{error}. Showing available dashboard data.</span>
              <button onClick={refreshDashboard}>
                <RefreshCw size={14} />
              </button>
            </div>
          )}

          <CurrentPage
            dashboard={dashboard}
            refreshDashboard={refreshDashboard}
            loading={loading}
          />
        </main>

        <footer className="footer">
          <span>TradeAlert</span>
          <span>TradingView Alerts & Telegram Notifications</span>
        </footer>
      </div>
    </div>
  );
}
