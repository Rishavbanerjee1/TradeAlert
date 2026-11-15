import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Activity,
  BriefcaseBusiness,
  Layers3,
  Send,
  Settings,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import OverviewPage from "../pages/overview/OverviewPage";
import SignalsPage from "../pages/signals/SignalsPage";
import PositionsPage from "../pages/positions/PositionsPage";
import StrategiesPage from "../pages/strategies/StrategiesPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import SettingsPage from "../pages/settings/SettingsPage";
import ProfilePage from "../pages/profile/ProfilePage";

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

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboard, setDashboard] = useState(mockDashboard);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");

  const activePage = location.pathname.split("/")[1] || "overview";

  function navigateToPage(id) {
    navigate(id === "overview" ? "/" : `/${id}`);
  }

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

  // Backend health check
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

  // Initial dashboard fetch
  useEffect(() => {
    refreshDashboard();
  }, []);

  const pageProps = {
    dashboard,
    refreshDashboard,
    loading,
    apiStatus,
  };

  return (
    <div className="app-shell">
      <Sidebar
        navigation={navigation}
        activePage={activePage}
        setActivePage={navigateToPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-area">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={refreshDashboard}
          onProfileClick={() => navigate("/profile")}
          loading={loading}
          apiStatus={apiStatus}
        />

        <main className="page-content">
          {error && (
            <div className="notice">
              <span>{error}. Showing available dashboard data.</span>

              <button onClick={refreshDashboard}>Refresh</button>
            </div>
          )}

          <Routes>
            <Route path="/" element={<OverviewPage {...pageProps} />} />

            <Route path="/signals" element={<SignalsPage {...pageProps} />} />

            <Route
              path="/positions"
              element={<PositionsPage {...pageProps} />}
            />

            <Route
              path="/strategies"
              element={<StrategiesPage {...pageProps} />}
            />

            <Route
              path="/notifications"
              element={<NotificationsPage {...pageProps} />}
            />

            <Route path="/settings" element={<SettingsPage {...pageProps} />} />

            <Route path="/profile" element={<ProfilePage {...pageProps} />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="footer">
          <span>TradeAlert</span>
          <span>TradingView Alerts & Telegram Notifications</span>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
